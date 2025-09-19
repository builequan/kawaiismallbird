import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Simple text parsing - no links, just text
function parseInlineText(text: string): any[] {
  if (!text) return []

  // Clean up markdown syntax
  const cleanText = text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[Image: $1]') // Images as text
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

// Convert markdown to simple Lexical format
function convertToLexical(content: string): any {
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
        children: parseInlineText(text)
      })
      continue
    }

    // Everything else as paragraph
    if (trimmed) {
      children.push({
        type: 'paragraph',
        version: 1,
        children: parseInlineText(trimmed)
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
    root: {
      type: 'root',
      version: 1,
      children: children
    }
  }
}

async function testSimpleImport() {
  const payload = await getPayload({ config: configPromise })
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'content_creation_db',
    user: 'postgres',
    password: '2801',
  })

  try {
    // Get one article
    const result = await pool.query(`
      SELECT id, title, content, language, category, status, meta_description, url_slug
      FROM articles
      WHERE site_id = 22
      AND language = 'ja'
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log('No articles found')
      return
    }

    const article = result.rows[0]
    console.log('Importing article:', article.title)

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

    // Convert content
    const lexicalContent = convertToLexical(article.content || '')
    console.log('\nFirst 3 nodes:')
    console.log(JSON.stringify(lexicalContent.root.children.slice(0, 3), null, 2))

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

testSimpleImport().catch(console.error)