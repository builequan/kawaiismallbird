import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Parse inline text with support for links and images
function parseInlineText(text: string): any[] {
  if (!text) return []

  // First, convert inline images to links for display
  let processedText = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    // Only convert if URL exists and is valid
    if (url && url.trim()) {
      const displayText = alt || 'View Image'
      return `[${displayText}](${url})`
    }
    return alt || 'Image' // Return just text if no valid URL
  })

  // Check for links (including converted images)
  const linkMatches = [...processedText.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]

  if (linkMatches.length > 0) {
    const nodes: any[] = []
    let lastIndex = 0

    for (const match of linkMatches) {
      const [fullMatch, linkText, url] = match
      const matchIndex = match.index!

      // Add text before link
      if (matchIndex > lastIndex) {
        const beforeText = processedText.substring(lastIndex, matchIndex)
        if (beforeText) {
          nodes.push({
            type: 'text',
            version: 1,
            text: beforeText
          })
        }
      }

      // Validate URL before creating link node
      const trimmedUrl = url?.trim()
      if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('/'))) {
        // Add link node only if URL is valid
        nodes.push({
          type: 'link',
          version: 1,
          url: trimmedUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          children: [{
            type: 'text',
            version: 1,
            text: linkText
          }]
        })
      } else {
        // If URL is invalid, just add as text
        nodes.push({
          type: 'text',
          version: 1,
          text: linkText
        })
      }

      lastIndex = matchIndex + fullMatch.length
    }

    // Add remaining text
    if (lastIndex < processedText.length) {
      nodes.push({
        type: 'text',
        version: 1,
        text: processedText.substring(lastIndex)
      })
    }

    return nodes
  }

  // No links, just clean text
  const cleanText = processedText
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')

  return [{
    type: 'text',
    version: 1,
    text: cleanText
  }]
}

// Convert markdown to Lexical format
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
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) {
      i++
      continue
    }

    // Skip HTML comments
    if (line.startsWith('<!--')) {
      i++
      continue
    }

    // Handle headers (# ## ### etc)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]

      children.push({
        type: 'heading',
        version: 1,
        tag: `h${Math.min(level, 6)}`,
        children: parseInlineText(text)
      })
      i++
      continue
    }

    // Handle images ![alt](url) - convert to clickable link
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      const alt = imageMatch[1] || 'View Image'
      const url = imageMatch[2]?.trim()

      // Validate URL before creating link
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        // Create a paragraph with a clickable link to the image
        children.push({
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'link',
              version: 1,
              url: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              children: [{
                type: 'text',
                version: 1,
                text: `📷 ${alt}`
              }]
            }
          ]
        })
      } else {
        // If URL is invalid, just add as text
        children.push({
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text: `📷 ${alt}`
            }
          ]
        })
      }
      i++
      continue
    }

    // Default: paragraph
    const paragraphLines: string[] = []
    while (i < lines.length) {
      const currentLine = lines[i].trim()

      // Stop if we hit special syntax (but allow inline images)
      if (!currentLine ||
          currentLine.startsWith('#') ||
          currentLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/) || // Block-level image only
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
        children: parseInlineText(paragraphText)
      })
    } else {
      i++ // Prevent infinite loop
    }
  }

  // If no children, add empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          version: 1,
          text: content
        }
      ]
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

async function testDirectImport() {
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
    console.log('\nLexical content preview:')
    console.log(JSON.stringify(lexicalContent.root.children.slice(0, 3), null, 2))

    // Create post
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: article.title || 'Untitled',
        content: lexicalContent,
        slug: article.url_slug || article.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'untitled',
        language: article.language === 'english' ? 'en' : 'ja',
        _status: 'published',
        publishedAt: new Date().toISOString(),
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
    console.log('View at: http://localhost:3000/posts/' + post.slug)

  } catch (error) {
    console.error('Import error:', error)
    if (error?.data) {
      console.error('Validation error data:', JSON.stringify(error.data, null, 2))
    }
  } finally {
    await pool.end()
  }

  process.exit(0)
}

testDirectImport().catch(console.error)