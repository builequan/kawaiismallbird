import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'
import fs from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

// Download image from URL
async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download: ${url}`)

  const dir = path.dirname(filepath)
  await fs.mkdir(dir, { recursive: true })

  const fileStream = createWriteStream(filepath)
  await pipeline(response.body as any, fileStream)
}

// Upload image to Payload Media collection
async function uploadImageToPayload(payload: any, imagePath: string, alt: string): Promise<string | null> {
  try {
    // Read the file
    const buffer = await fs.readFile(imagePath)
    const filename = path.basename(imagePath)

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: 'image/jpeg' })

    // Create FormData
    const formData = new FormData()
    formData.append('file', blob as any, filename)
    formData.append('alt', alt || 'Image')

    // Upload to Payload
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: alt || 'Image',
      },
      file: {
        data: buffer,
        mimetype: 'image/jpeg',
        name: filename,
        size: buffer.length,
      },
    })

    return media.id
  } catch (error) {
    console.error('Failed to upload image:', error)
    return null
  }
}

// Parse inline text and handle images
async function parseInlineText(text: string, payload: any, imageMap: Map<string, string>): Promise<any[]> {
  if (!text) return []

  const nodes: any[] = []
  let remaining = text

  // Process images in text
  const imageMatches = [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]

  if (imageMatches.length > 0) {
    let lastIndex = 0

    for (const match of imageMatches) {
      const [fullMatch, alt, url] = match
      const matchIndex = match.index!

      // Add text before image
      if (matchIndex > lastIndex) {
        const beforeText = text.substring(lastIndex, matchIndex)
        if (beforeText) {
          nodes.push({
            type: 'text',
            version: 1,
            text: beforeText
          })
        }
      }

      // Check if we've already uploaded this image
      let mediaId = imageMap.get(url)

      if (!mediaId && url.startsWith('http')) {
        // Download and upload the image
        try {
          const tempDir = '/tmp/import-images'
          await fs.mkdir(tempDir, { recursive: true })

          const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
          const filepath = path.join(tempDir, filename)

          console.log(`Downloading image: ${url}`)
          await downloadImage(url, filepath)

          console.log(`Uploading to Payload...`)
          mediaId = await uploadImageToPayload(payload, filepath, alt)

          if (mediaId) {
            imageMap.set(url, mediaId)
            console.log(`Uploaded successfully: ${mediaId}`)
          }

          // Clean up temp file
          await fs.unlink(filepath).catch(() => {})
        } catch (error) {
          console.error(`Failed to process image ${url}:`, error)
        }
      }

      // Add image node or fallback text
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
        nodes.push({
          type: 'text',
          version: 1,
          text: `[Image: ${alt || 'unavailable'}]`
        })
      }

      lastIndex = matchIndex + fullMatch.length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      nodes.push({
        type: 'text',
        version: 1,
        text: text.substring(lastIndex)
      })
    }

    return nodes
  }

  // No images, clean text
  const cleanText = text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links as text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/__([^_]+)__/g, '$1') // Bold alt
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/_([^_]+)_/g, '$1') // Italic alt

  return [{
    type: 'text',
    version: 1,
    text: cleanText
  }]
}

// Convert markdown to Lexical with image uploads
async function convertToLexical(content: string, payload: any): Promise<any> {
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

  const children: any[] = []
  const lines = content.split('\n')
  const imageMap = new Map<string, string>() // URL to mediaId map

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
        children: await parseInlineText(text, payload, imageMap)
      })
      i++
      continue
    }

    // Handle standalone images
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      const [_, alt, url] = imageMatch

      let mediaId = imageMap.get(url)

      if (!mediaId && url.startsWith('http')) {
        try {
          const tempDir = '/tmp/import-images'
          await fs.mkdir(tempDir, { recursive: true })

          const filename = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
          const filepath = path.join(tempDir, filename)

          console.log(`Downloading image: ${url}`)
          await downloadImage(url, filepath)

          console.log(`Uploading to Payload...`)
          mediaId = await uploadImageToPayload(payload, filepath, alt)

          if (mediaId) {
            imageMap.set(url, mediaId)
            console.log(`Uploaded successfully: ${mediaId}`)
          }

          // Clean up temp file
          await fs.unlink(filepath).catch(() => {})
        } catch (error) {
          console.error(`Failed to process image ${url}:`, error)
        }
      }

      // Create paragraph with upload node
      if (mediaId) {
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
        children.push({
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text: `[Image: ${alt || 'unavailable'}]`
            }
          ]
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
            children: await parseInlineText(itemText, payload, imageMap)
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

    // Default: paragraph
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
      children.push({
        type: 'paragraph',
        version: 1,
        children: await parseInlineText(paragraphText, payload, imageMap)
      })
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

async function importWithImages() {
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
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log('No articles with images found')
      return
    }

    const article = result.rows[0]
    console.log('\n=== IMPORTING ARTICLE WITH IMAGES ===')
    console.log('Title:', article.title)

    // Check if already imported
    const existing = await payload.find({
      collection: 'posts',
      where: {
        'contentDbMeta.originalId': { equals: String(article.id) },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log('Article already imported, deleting it first...')
      await payload.delete({
        collection: 'posts',
        id: existing.docs[0].id,
      })
    }

    // Convert content with image uploads
    console.log('\nProcessing content and images...')
    const lexicalContent = await convertToLexical(article.content || '', payload)

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
    console.log('\nCreating post...')
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

    console.log('\n✅ Import successful!')
    console.log('Post ID:', post.id)
    console.log('Slug:', post.slug)
    console.log('View at: http://localhost:3000/posts/' + post.slug)

    // Check media collection
    const mediaItems = await payload.find({
      collection: 'media',
      limit: 10,
    })
    console.log(`\n📷 Media items in collection: ${mediaItems.totalDocs}`)

  } catch (error) {
    console.error('Import error:', error)
    if (error?.data) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
    }
  } finally {
    await pool.end()
  }

  process.exit(0)
}

importWithImages().catch(console.error)