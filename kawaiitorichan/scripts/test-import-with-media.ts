import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Parse inline text - simplified for now
function parseInlineText(text: string, imageUrls: string[]): any[] {
  if (!text) return []

  // Collect image URLs from text
  const imageMatches = [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
  for (const match of imageMatches) {
    const url = match[2]
    if (url && url.startsWith('http') && !imageUrls.includes(url)) {
      imageUrls.push(url)
    }
  }

  // Clean up markdown and return as text for now
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

// Convert markdown to Lexical and collect image URLs
function convertToLexical(content: string): { lexical: any, imageUrls: string[] } {
  const imageUrls: string[] = []

  if (!content) {
    return {
      lexical: {
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
      },
      imageUrls
    }
  }

  const children: any[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('<!--')) continue

    // Handle headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]

      children.push({
        type: 'heading',
        version: 1,
        tag: `h${Math.min(level, 6)}`,
        children: parseInlineText(text, imageUrls)
      })
      continue
    }

    // Handle standalone images - collect URLs
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      const [_, alt, url] = imageMatch

      if (url && url.startsWith('http') && !imageUrls.includes(url)) {
        imageUrls.push(url)
      }

      // For now, add as text
      children.push({
        type: 'paragraph',
        version: 1,
        children: [{
          type: 'text',
          version: 1,
          text: `[Image: ${alt || 'Image'}]`
        }]
      })
      continue
    }

    // Everything else as paragraph
    if (trimmed) {
      children.push({
        type: 'paragraph',
        version: 1,
        children: parseInlineText(trimmed, imageUrls)
      })
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
    lexical: {
      root: {
        type: 'root',
        version: 1,
        children: children
      }
    },
    imageUrls
  }
}

// Download and create media item
async function createMediaFromUrl(payload: any, url: string, alt: string = 'Image'): Promise<string | null> {
  try {
    console.log(`  Downloading: ${url}`)

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

    console.log(`  Creating media item: ${filename}`)

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

    console.log(`  ✅ Created media ID: ${media.id}`)
    return media.id

  } catch (error) {
    console.error(`  ❌ Failed to create media from ${url}:`, error.message)
    return null
  }
}

async function testImportWithMedia() {
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
    console.log('\n=== IMPORTING ARTICLE ===')
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
      console.log('Deleting existing post...')
      await payload.delete({
        collection: 'posts',
        id: existing.docs[0].id,
      })
    }

    // Convert content and get image URLs
    console.log('\n📄 Processing content...')
    const { lexical, imageUrls } = convertToLexical(article.content || '')

    console.log(`\n📷 Found ${imageUrls.length} images to download`)

    // Download and create media items
    const mediaMap = new Map<string, string>()
    for (const url of imageUrls) {
      const mediaId = await createMediaFromUrl(payload, url, 'Article image')
      if (mediaId) {
        mediaMap.set(url, mediaId)
      }
    }

    console.log(`\n✅ Successfully uploaded ${mediaMap.size} images to Media collection`)

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
    console.log('\n📝 Creating post...')
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: article.title || 'Untitled',
        content: lexical,
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

    console.log('\n✅ Import complete!')
    console.log('Post ID:', post.id)
    console.log('Slug:', post.slug)
    console.log('View post at: http://localhost:3000/posts/' + post.slug)

    // Check media collection
    const mediaItems = await payload.find({
      collection: 'media',
      limit: 100,
    })
    console.log(`\n📷 Total media items: ${mediaItems.totalDocs}`)
    console.log('View media at: http://localhost:3000/admin/collections/media')

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

testImportWithMedia().catch(console.error)