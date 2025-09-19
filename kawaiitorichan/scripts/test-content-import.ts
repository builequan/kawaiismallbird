import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

// Convert inline images to link format for display
function processImages(text: string): string {
  // Convert markdown images to clickable links
  return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const displayText = alt || 'View Image'
    return `[${displayText}](${url})`
  })
}

// Parse inline text
function parseInlineText(text: string): any[] {
  if (!text) return []

  // Process images first - convert to links
  let processedText = processImages(text)

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

      // Add link node
      nodes.push({
        type: 'link',
        version: 1,
        url: url,
        target: '_blank',
        rel: 'noopener noreferrer',
        children: [{
          type: 'text',
          version: 1,
          text: linkText
        }]
      })

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

async function testImport() {
  const payload = await getPayload({ config: configPromise })
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'content_creation_db',
    user: 'postgres',
    password: '2801',
  })

  const result = await pool.query(`
    SELECT title, content
    FROM articles
    WHERE site_id = 22
    AND content LIKE '%![%'
    LIMIT 1
  `)

  const article = result.rows[0]
  console.log('Article:', article.title)
  console.log('\nFirst 500 chars of content:')
  console.log(article.content.substring(0, 500))

  // Test inline text parsing with image
  const testLine = article.content.split('\n')[0]
  console.log('\n=== Testing image line ===')
  console.log('Original:', testLine)
  
  const parsed = parseInlineText(testLine)
  console.log('\nParsed nodes:')
  console.log(JSON.stringify(parsed, null, 2))

  await pool.end()
  process.exit(0)
}

testImport().catch(console.error)
