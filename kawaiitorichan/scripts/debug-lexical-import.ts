import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Parse inline markdown like bold and italic
function parseInlineMarkdown(text: string): any[] {
  if (!text) return []

  const nodes: any[] = []
  let remaining = text

  // Process the text for bold and italic
  while (remaining) {
    let matched = false

    // Check for bold (**text** or __text__)
    const boldMatch = remaining.match(/^(.*?)(\*\*|__)([^*_]+)\2(.*)$/)
    if (boldMatch) {
      // Add text before bold
      if (boldMatch[1]) {
        nodes.push({
          type: 'text',
          format: 0,
          style: '',
          mode: 'normal',
          text: boldMatch[1],
          detail: 0,
          version: 1
        })
      }
      // Add bold text
      nodes.push({
        type: 'text',
        format: 1, // bold
        style: '',
        mode: 'normal',
        text: boldMatch[3],
        detail: 0,
        version: 1
      })
      remaining = boldMatch[4]
      matched = true
    }

    // Check for italic (*text* or _text_) if no bold found
    if (!matched) {
      const italicMatch = remaining.match(/^(.*?)(\*|_)([^*_]+)\2(.*)$/)
      if (italicMatch) {
        // Add text before italic
        if (italicMatch[1]) {
          nodes.push({
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal',
            text: italicMatch[1],
            detail: 0,
            version: 1
          })
        }
        // Add italic text
        nodes.push({
          type: 'text',
          format: 2, // italic
          style: '',
          mode: 'normal',
          text: italicMatch[3],
          detail: 0,
          version: 1
        })
        remaining = italicMatch[4]
        matched = true
      }
    }

    // If no match found, add the remaining text as normal
    if (!matched) {
      nodes.push({
        type: 'text',
        format: 0,
        style: '',
        mode: 'normal',
        text: remaining,
        detail: 0,
        version: 1
      })
      break
    }
  }

  // Return at least one empty text node if no nodes created
  if (nodes.length === 0) {
    nodes.push({
      type: 'text',
      format: 0,
      style: '',
      mode: 'normal',
      text: '',
      detail: 0,
      version: 1
    })
  }

  return nodes
}

// Convert markdown to Lexical format - start simple and gradually add features
function convertToLexical(content: string): any {
  if (!content) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [],
            direction: null
          }
        ],
        direction: 'ltr'
      }
    }
  }

  // For now, use the simple format that we know works
  // Just split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim())

  const children = paragraphs.map(paragraph => {
    // Remove any remaining markdown image syntax for now
    const cleanedText = paragraph
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove link URLs but keep text

    return {
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      children: parseInlineMarkdown(cleanedText),
      direction: null
    }
  })

  // If no children, add empty paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'text',
          format: 0,
          style: '',
          mode: 'normal',
          text: content,
          detail: 0,
          version: 1
        }
      ],
      direction: null
    })
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: children,
      direction: 'ltr'
    }
  }
}

async function debugLexicalImport() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Connect to content database
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'content_creation_db',
      user: 'postgres',
      password: '2801',
    })

    // Fetch a problematic article (2563 was the first to fail)
    const result = await pool.query(`
      SELECT
        id,
        site_id,
        title,
        content,
        language,
        category,
        status,
        meta_description,
        primary_keyword,
        url_slug,
        published_at,
        created_at,
        updated_at
      FROM articles
      WHERE id = 2563
    `)

    if (result.rows.length === 0) {
      console.log('Article 2563 not found')
      await pool.end()
      process.exit(1)
    }

    const article = result.rows[0]
    console.log('Testing with article:', {
      id: article.id,
      title: article.title,
      contentLength: article.content?.length || 0,
      contentSample: article.content?.substring(0, 200)
    })

    // Convert content with our parser
    console.log('\n=== Testing Lexical Conversion ===')
    const lexicalContent = convertToLexical(article.content || '')

    console.log('\nGenerated Lexical structure:')
    console.log(JSON.stringify(lexicalContent, null, 2))

    // Find category
    let categoryId = null
    const categories = await payload.find({
      collection: 'categories',
      where: {
        slug: { equals: 'pet-birds' },
      },
      limit: 1,
    })

    if (categories.docs.length > 0) {
      categoryId = categories.docs[0].id
      console.log('\nFound category:', categories.docs[0].title)
    }

    // Prepare post data
    const postData = {
      title: article.title || 'Debug Import Test',
      content: lexicalContent,
      slug: `debug-import-${Date.now()}`,
      language: 'ja',
      _status: 'published' as const,
      publishedAt: new Date().toISOString(),
      meta: {
        title: article.title || 'Debug Import Test',
        description: article.meta_description || '',
      },
      categories: categoryId ? [categoryId] : [],
      contentDbMeta: {
        originalId: String(article.id),
        websiteId: article.site_id,
        language: article.language,
        importedAt: new Date().toISOString(),
      },
    }

    console.log('\n=== Attempting to create post ===')

    try {
      const created = await payload.create({
        collection: 'posts',
        data: postData,
      })

      console.log('\n✅ SUCCESS! Created post:', {
        id: created.id,
        title: created.title,
        slug: created.slug,
      })
    } catch (error: any) {
      console.error('\n❌ VALIDATION ERROR:', error.message)
      if (error?.data) {
        console.error('\nDetailed validation errors:')
        console.error(JSON.stringify(error.data, null, 2))
      }

      // Try with even simpler content
      console.log('\n=== Trying with ultra-simple content ===')
      const ultraSimpleContent = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'text',
                  format: 0,
                  style: '',
                  mode: 'normal',
                  text: 'Test content',
                  detail: 0,
                  version: 1
                }
              ],
              direction: null
            }
          ],
          direction: 'ltr'
        }
      }

      postData.content = ultraSimpleContent
      postData.slug = `ultra-simple-${Date.now()}`

      const created = await payload.create({
        collection: 'posts',
        data: postData,
      })

      console.log('\n✅ Ultra-simple worked! Post created:', created.id)
      console.log('\nThis means the issue is with the Lexical content structure')
    }

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Script error:', error)
    process.exit(1)
  }
}

debugLexicalImport()