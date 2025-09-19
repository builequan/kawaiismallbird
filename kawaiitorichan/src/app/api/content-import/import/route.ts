import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'

// Download and create media item
async function createMediaFromUrl(payload: any, url: string, alt: string = 'Image'): Promise<string | null> {
  try {
    // Download the image
    const response = await fetch(url)
    if (!response.ok) {
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

    return media.id
  } catch (error) {
    console.error(`Failed to create media from ${url}:`, error)
    return null
  }
}

// Parse inline text - NO inline images, just text
function parseInlineText(text: string, mediaMap: Map<string, string>): any[] {
  if (!text) return []

  // Clean markdown and convert images to text placeholders
  // Inline images will be handled separately as block-level elements
  const cleanText = text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '') // Remove inline images - they'll be block-level
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links as text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/__([^_]+)__/g, '$1') // Remove bold alt
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/_([^_]+)_/g, '$1') // Remove italic alt
    .trim()

  if (!cleanText) return []

  return [{
    type: 'text',
    version: 1,
    text: cleanText
  }]
}

// Convert markdown to Lexical format with image uploads
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

  // Download and upload all images
  const mediaMap = new Map<string, string>() // URL -> media ID
  for (const [url, alt] of imageUrls) {
    const mediaId = await createMediaFromUrl(payload, url, alt)
    if (mediaId) {
      mediaMap.set(url, mediaId)
    }
  }

  const children: any[] = []
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
        // Add upload node directly at root level - only required fields
        children.push({
          type: 'upload',
          relationTo: 'media',
          value: mediaId // Just the ID, not an object
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

    // Handle simple tables (basic support)
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|---')) {
      const tableLines: string[] = []

      // Collect table lines
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }

      // Parse table
      if (tableLines.length >= 3) { // header + separator + at least one row
        const headerCells = tableLines[0].split('|').filter(c => c.trim())
        const dataRows = tableLines.slice(2) // Skip separator

        // Create table structure
        const tableRows: any[] = []

        // Header row
        const headerRow = {
          type: 'tablerow',
          version: 1,
          children: headerCells.map(cell => ({
            type: 'tablecell',
            version: 1,
            headerState: 3, // header
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: parseInlineText(cell.trim(), mediaMap)
              }
            ]
          }))
        }
        tableRows.push(headerRow)

        // Data rows
        dataRows.forEach(row => {
          const cells = row.split('|').filter(c => c.trim())
          if (cells.length > 0) {
            tableRows.push({
              type: 'tablerow',
              version: 1,
              children: cells.map(cell => ({
                type: 'tablecell',
                version: 1,
                headerState: 0, // regular cell
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: parseInlineText(cell.trim(), mediaMap)
                  }
                ]
              }))
            })
          }
        })

        // Add table to children
        children.push({
          type: 'table',
          version: 1,
          children: tableRows
        })
        continue
      }
    }

    // Handle unordered lists (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: any[] = []

      while (i < lines.length) {
        const currentLine = lines[i].trim()
        if (currentLine.startsWith('- ') || currentLine.startsWith('* ')) {
          const itemText = currentLine.substring(2).trim()
          listItems.push({
            type: 'listitem',
            value: listItems.length + 1,
            indent: 0, // Add indent property to prevent "Invalid indent value" error
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

    // Handle ordered lists (1. 2. etc)
    if (/^\d+\.\s/.test(line)) {
      const listItems: any[] = []

      while (i < lines.length) {
        const currentLine = lines[i].trim()
        const orderedMatch = currentLine.match(/^(\d+)\.\s(.+)/)
        if (orderedMatch) {
          const itemText = orderedMatch[2]
          listItems.push({
            type: 'listitem',
            value: listItems.length + 1,
            indent: 0, // Add indent property to prevent "Invalid indent value" error
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
          tag: 'ol',
          listType: 'number',
          children: listItems
        })
        continue
      }
    }

    // Default: paragraph
    // Collect consecutive lines that aren't special syntax
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

      // Check for inline images in the paragraph text
      const inlineImageMatches = [...paragraphText.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]

      if (inlineImageMatches.length > 0) {
        // Process text with inline images
        let lastIndex = 0

        for (const match of inlineImageMatches) {
          const [fullMatch, alt, url] = match
          const matchIndex = match.index!

          // Add text before image as paragraph
          if (matchIndex > lastIndex) {
            const beforeText = paragraphText.substring(lastIndex, matchIndex).trim()
            if (beforeText) {
              children.push({
                type: 'paragraph',
                version: 1,
                children: parseInlineText(beforeText, mediaMap)
              })
            }
          }

          // Add image as block-level upload node - only required fields
          const mediaId = mediaMap.get(url)
          if (mediaId) {
            children.push({
              type: 'upload',
              relationTo: 'media',
              value: mediaId
            })
          }

          lastIndex = matchIndex + fullMatch.length
        }

        // Add remaining text after last image
        if (lastIndex < paragraphText.length) {
          const afterText = paragraphText.substring(lastIndex).trim()
          if (afterText) {
            children.push({
              type: 'paragraph',
              version: 1,
              children: parseInlineText(afterText, mediaMap)
            })
          }
        }
      } else {
        // No inline images, just add as regular paragraph
        const textChildren = parseInlineText(paragraphText, mediaMap)
        if (textChildren.length > 0) {
          children.push({
            type: 'paragraph',
            version: 1,
            children: textChildren
          })
        }
      }
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

// Helper to map category intelligently based on content
async function mapCategory(article: any, payload: any) {
  const categoryMapping: Record<string, string> = {
    // Map common bird-related categories
    'housing & cage setup': 'bird-care',
    'housing-cage-setup': 'bird-care',
    'nutrition & feeding': 'bird-care',
    'nutrition-feeding': 'bird-care',
    'health & wellness': 'bird-health',
    'health-wellness': 'bird-health',
    'training & behavior': 'bird-care',
    'training-behavior': 'bird-care',
    'breeding & genetics': 'bird-ecology',
    'breeding-genetics': 'bird-ecology',
    'popular small bird species': 'bird-species',
    'popular-small-bird-species': 'bird-species',

    // Map specific bird types
    'parakeets': 'pet-birds',
    'canaries': 'pet-birds',
    'finches': 'pet-birds',
    'cockatiels': 'pet-birds',
    'lovebirds': 'pet-birds',
    'budgies': 'pet-birds',
    'budgerigars': 'pet-birds',

    // Japanese mappings
    'インコ': 'pet-birds',
    'カナリア': 'pet-birds',
    '文鳥': 'pet-birds',
    'セキセイインコ': 'pet-birds',
    'オカメインコ': 'pet-birds',
    'ラブバード': 'pet-birds',
  }

  let categorySlug = 'bird-species' // Default category

  if (article.category) {
    const normalizedCategory = article.category.toLowerCase().trim()

    // Check for exact mapping
    if (categoryMapping[normalizedCategory]) {
      categorySlug = categoryMapping[normalizedCategory]
    } else {
      // Check if category contains bird type keywords
      const keywords = ['parakeet', 'canary', 'finch', 'cockatiel', 'lovebird', 'budgie',
                        'インコ', 'カナリア', '文鳥', 'オカメ', 'セキセイ']

      for (const keyword of keywords) {
        if (normalizedCategory.includes(keyword) || article.title?.toLowerCase().includes(keyword)) {
          categorySlug = 'pet-birds'
          break
        }
      }

      // Check for care-related keywords
      if (normalizedCategory.includes('care') || normalizedCategory.includes('feeding') ||
          normalizedCategory.includes('housing') || normalizedCategory.includes('cage')) {
        categorySlug = 'bird-care'
      } else if (normalizedCategory.includes('health') || normalizedCategory.includes('wellness')) {
        categorySlug = 'bird-health'
      } else if (normalizedCategory.includes('species') || normalizedCategory.includes('types')) {
        categorySlug = 'bird-species'
      }
    }
  }

  // Find the category by slug
  const categories = await payload.find({
    collection: 'categories',
    where: {
      slug: { equals: categorySlug },
    },
    limit: 1,
  })

  if (categories.docs.length > 0) {
    return categories.docs[0].id
  }

  // If category doesn't exist, try to create it
  try {
    const newCategory = await payload.create({
      collection: 'categories',
      data: {
        title: categorySlug.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        slug: categorySlug,
      }
    })
    return newCategory.id
  } catch (err) {
    console.log('Could not create or find category:', categorySlug)
    return null
  }
}

// Helper to convert database article to Payload format
async function convertArticleToPayload(article: any, payload: any) {
  try {
    // Convert content to Lexical format with image uploads
    const lexicalContent = await convertToLexical(article.content || '', payload)

    // Map category intelligently
    const categoryId = await mapCategory(article, payload)

    // Prepare post data
    const postData: any = {
      title: article.title || 'Untitled',
      content: lexicalContent,
      slug: article.url_slug || article.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'untitled',
      language: article.language === 'english' ? 'en' : article.language,
      _status: article.status === 'published' ? 'published' : 'draft',
      publishedAt: article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString(),
      meta: {
        title: article.title,
        description: article.meta_description || '',
      },
      // Store content database metadata for duplicate detection
      contentDbMeta: {
        originalId: String(article.id),
        websiteId: article.site_id,
        language: article.language,
        importedAt: new Date().toISOString(),
      },
    }

    // Add category if found
    if (categoryId) {
      postData.categories = [categoryId]
    }

    return postData
  } catch (error) {
    console.error('Error converting article:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json()
        const { articleIds, websiteId, language } = body

        if (!articleIds || articleIds.length === 0) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: 'No articles selected' }) + '\n')
          )
          controller.close()
          return
        }

        // Send initial message
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              message: `Starting import of ${articleIds.length} articles...`,
              progress: 0,
            }) + '\n'
          )
        )

        const pool = new Pool({
          host: 'localhost',
          port: 5432,
          database: 'content_creation_db',
          user: 'postgres',
          password: '2801',
        })

        try {
          // Get Payload instance
          const payload = await getPayloadHMR({ config })

          // Fetch articles from database
          const result = await pool.query(
            `SELECT
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
              updated_at,
              featured_image_url
            FROM articles
            WHERE id = ANY($1::int[])`,
            [articleIds]
          )

          const articles = result.rows
          const stats = {
            totalImported: articles.length,
            successCount: 0,
            failureCount: 0,
            duplicatesSkipped: 0,
            imagesUploaded: 0,
          }

          // Process each article
          for (let i = 0; i < articles.length; i++) {
            const article = articles[i]
            const progress = Math.round(((i + 1) / articles.length) * 100)

            try {
              // Check for duplicates using contentDbMeta fields
              const existing = await payload.find({
                collection: 'posts',
                where: {
                  'contentDbMeta.originalId': { equals: String(article.id) },
                  'contentDbMeta.websiteId': { equals: article.site_id },
                },
                limit: 1,
              })

              if (existing.docs.length > 0) {
                stats.duplicatesSkipped++
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      message: `Skipped duplicate: ${article.title}`,
                      progress,
                    }) + '\n'
                  )
                )
                continue
              }

              // Convert and import article with images
              const postData = await convertArticleToPayload(article, payload)

              await payload.create({
                collection: 'posts',
                data: postData,
              })

              stats.successCount++
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    message: `Imported: ${article.title}`,
                    progress,
                  }) + '\n'
                )
              )
            } catch (error: any) {
              stats.failureCount++
              console.error(`Failed to import article ${article.id}:`, error)

              // Log more details about the validation error
              if (error?.data) {
                console.error('Validation error data:', JSON.stringify(error.data, null, 2))
              }

              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    message: `Failed: ${article.title}`,
                    progress,
                    error: true,
                  }) + '\n'
                )
              )
            }
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                complete: true,
                stats,
                message: `Import complete: ${stats.successCount} imported, ${stats.failureCount} failed, ${stats.duplicatesSkipped} duplicates skipped`,
                progress: 100,
              }) + '\n'
            )
          )
        } finally {
          await pool.end()
        }
      } catch (error) {
        console.error('Import error:', error)
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              error: 'Import failed',
              message: error instanceof Error ? error.message : 'Unknown error',
            }) + '\n'
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}