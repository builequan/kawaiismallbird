import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Download and create media item
async function createMediaFromUrl(payload: any, url: string, alt: string = 'Image'): Promise<string | null> {
  try {
    console.log(`  📥 Downloading: ${url.substring(0, 50)}...`)

    // Download the image
    const response = await fetch(url)
    if (!response.ok) {
      console.log(`  ❌ Failed to download: ${response.status}`)
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Extract filename from URL or generate one
    const urlParts = url.split('/')
    let filename = urlParts[urlParts.length - 1] || 'image.jpg'

    // Clean filename
    filename = filename.split('?')[0] // Remove query params
    if (!filename.includes('.')) {
      filename = `image_${Date.now()}.jpg`
    }

    // Create media item in Payload
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: alt || 'Imported image',
        url: url, // Store original URL for reference
      },
      file: {
        data: buffer,
        mimetype: contentType,
        name: filename,
        size: buffer.length,
      },
    })

    console.log(`  ✅ Uploaded as media ID: ${media.id}`)
    return media.id

  } catch (error) {
    console.error(`  ❌ Failed to create media:`, error.message)
    return null
  }
}

// Parse inline text and embed images
function parseInlineText(text: string, mediaMap: Map<string, string>): any[] {
  if (!text) return []

  const nodes: any[] = []
  let lastIndex = 0

  // Find all images in the text
  const imageMatches = [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]

  for (const match of imageMatches) {
    const [fullMatch, alt, url] = match
    const matchIndex = match.index!

    // Add text before image
    if (matchIndex > lastIndex) {
      const beforeText = text.substring(lastIndex, matchIndex)
      if (beforeText) {
        // Clean markdown from text
        const cleanText = beforeText
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links as text
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/__([^_]+)__/g, '$1') // Remove bold alt
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/_([^_]+)_/g, '$1') // Remove italic alt

        nodes.push({
          type: 'text',
          version: 1,
          text: cleanText
        })
      }
    }

    // Add image as upload node if we have a media ID
    const mediaId = mediaMap.get(url)
    if (mediaId) {
      nodes.push({
        type: 'upload',
        version: 1,
        relationTo: 'media',
        value: {
          id: mediaId
        }
      })
    } else {
      // Fallback to text if no media ID
      nodes.push({
        type: 'text',
        version: 1,
        text: `[Image: ${alt || 'unavailable'}]`
      })
    }

    lastIndex = matchIndex + fullMatch.length
  }

  // Add remaining text after last image
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    const cleanText = remainingText
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links as text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/__([^_]+)__/g, '$1') // Remove bold alt
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/_([^_]+)_/g, '$1') // Remove italic alt

    if (cleanText) {
      nodes.push({
        type: 'text',
        version: 1,
        text: cleanText
      })
    }
  }

  // If no nodes were created, return clean text
  if (nodes.length === 0) {
    const cleanText = text
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[Image: $1]') // Images as text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links as text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/__([^_]+)__/g, '$1') // Remove bold alt
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/_([^_]+)_/g, '$1') // Remove italic alt

    return [{
      type: 'text',
      version: 1,
      text: cleanText
    }]
  }

  return nodes
}

// Convert markdown to Lexical with embedded images
async function convertToLexicalWithImages(
  content: string,
  payload: any
): Promise<any> {
  if (!content) {
    return {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: []
          }
        ]
      }
    }
  }

  // First pass: collect all image URLs
  const imageUrls = new Map<string, string>() // URL -> alt text
  const lines = content.split('\n')

  for (const line of lines) {
    // Find images in any position
    const imageMatches = [...line.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
    for (const match of imageMatches) {
      const [_, alt, url] = match
      if (url && url.startsWith('http')) {
        imageUrls.set(url, alt || 'Image')
      }
    }
  }

  console.log(`\n📷 Found ${imageUrls.size} unique images to process`)

  // Download and upload all images
  const mediaMap = new Map<string, string>() // URL -> media ID
  for (const [url, alt] of imageUrls) {
    const mediaId = await createMediaFromUrl(payload, url, alt)
    if (mediaId) {
      mediaMap.set(url, mediaId)
    }
  }

  console.log(`✅ Successfully uploaded ${mediaMap.size} images`)

  // Second pass: build Lexical content with embedded images
  const children: any[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('<!--')) {
      i++
      continue
    }

    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]

      children.push({
        type: 'heading',
        version: 1,
        tag: `h${Math.min(level, 6)}`,
        children: parseInlineText(text, mediaMap)
      })
      i++
      continue
    }

    // Handle standalone images
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      const [_, alt, url] = imageMatch
      const mediaId = mediaMap.get(url)

      if (mediaId) {
        // Create paragraph with upload node
        children.push({
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'upload',
              version: 1,
              relationTo: 'media',
              value: {
                id: mediaId
              }
            }
          ]
        })
      } else {
        // Fallback to text
        children.push({
          type: 'paragraph',
          version: 1,
          children: [{
            type: 'text',
            version: 1,
            text: `[Image: ${alt || 'unavailable'}]`
          }]
        })
      }
      i++
      continue
    }

    // Handle lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: any[] = []

      while (i < lines.length) {
        const currentLine = lines[i].trim()
        if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
          const itemText = currentLine.substring(2).trim()
          listItems.push({
            type: 'listitem',
            version: 1,
            value: listItems.length + 1,
            children: parseInlineText(itemText, mediaMap)
          })
          i++
        } else {
          break
        }
      }

      if (listItems.length > 0) {
        children.push({
          type: 'list',
          version: 1,
          tag: 'ul',
          listType: 'bullet',
          children: listItems
        })
        continue
      }
    }

    // Handle tables (simplified - just as text for now)
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|---')) {
      // Skip table for simplicity, add as text
      while (i < lines.length && lines[i].includes('|')) {
        children.push({
          type: 'paragraph',
          version: 1,
          children: [{
            type: 'text',
            version: 1,
            text: lines[i].trim()
          }]
        })
        i++
      }
      continue
    }

    // Default: paragraph with potential inline images
    const paragraphLines: string[] = []
    while (i < lines.length) {
      const currentLine = lines[i].trim()

      // Stop if we hit special syntax
      if (!currentLine ||
          currentLine.startsWith('#') ||
          currentLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/) ||
          currentLine.startsWith('- ') ||
          currentLine.startsWith('* ') ||
          currentLine.includes('|---') ||
          /^\d+\.\s/.test(currentLine)) {
        break
      }

      paragraphLines.push(currentLine)
      i++
    }

    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join(' ')
      const paragraphChildren = parseInlineText(paragraphText, mediaMap)

      if (paragraphChildren.length > 0) {
        children.push({
          type: 'paragraph',
          version: 1,
          children: paragraphChildren
        })
      }
    } else {
      i++
    }
  }

  // If no children, add empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        version: 1,
        text: ''
      }]
    })
  }

  return {
    root: {
      type: 'root',
      version: 1,
      children: children
    }
  }
}

async function importCompleteWithImages() {
  const payload = await getPayload({ config: configPromise })
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'content_creation_db',
    user: 'postgres',
    password: '2801',
  })

  try {
    // Get one article with images
    const result = await pool.query(`
      SELECT id, title, content, language, category, status, meta_description, url_slug
      FROM articles
      WHERE site_id = 22
      AND content LIKE '%![%'
      AND content LIKE '%runware%'
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log('No articles with images found')
      return
    }

    const article = result.rows[0]
    console.log('\n🚀 IMPORTING ARTICLE WITH IMAGES')
    console.log('📄 Title:', article.title)

    // Delete existing post if any
    const existing = await payload.find({
      collection: 'posts',
      where: {
        'contentDbMeta.originalId': { equals: String(article.id) },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log('🗑️  Deleting existing post...')
      await payload.delete({
        collection: 'posts',
        id: existing.docs[0].id,
      })
    }

    // Convert content with image uploads
    console.log('\n📝 Processing content and uploading images...')
    const lexicalContent = await convertToLexicalWithImages(article.content || '', payload)

    // Find or create category
    let categoryId = null
    const categories = await payload.find({
      collection: 'categories',
      where: {
        slug: { equals: 'bird-species' },
      },
      limit: 1,
    })

    if (categories.docs.length > 0) {
      categoryId = categories.docs[0].id
    } else {
      const newCategory = await payload.create({
        collection: 'categories',
        data: {
          title: 'Bird Species',
          slug: 'bird-species',
        }
      })
      categoryId = newCategory.id
    }

    // Create post
    console.log('\n💾 Creating post with embedded images...')
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: article.title || 'Untitled',
        content: lexicalContent,
        slug: article.url_slug || article.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'untitled',
        language: 'ja',
        _status: 'published',
        publishedAt: new Date().toISOString(),
        categories: categoryId ? [categoryId] : [],
        meta: {
          title: article.title,
          description: article.meta_description || '',
        },
        contentDbMeta: {
          originalId: String(article.id),
          websiteId: 22,
          language: article.language,
          importedAt: new Date().toISOString(),
        },
      },
    })

    console.log('\n🎉 IMPORT COMPLETE!')
    console.log('📌 Post ID:', post.id)
    console.log('🔗 View post: http://localhost:3000/posts/' + post.slug)

    // Check media collection
    const mediaItems = await payload.find({
      collection: 'media',
      limit: 100,
    })
    console.log(`\n📸 Total media items in collection: ${mediaItems.totalDocs}`)
    console.log('🖼️  View media: http://localhost:3000/admin/collections/media')

  } catch (error) {
    console.error('\n❌ Import error:', error)
    if (error?.data) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
    }
  } finally {
    await pool.end()
  }

  process.exit(0)
}

importCompleteWithImages().catch(console.error)