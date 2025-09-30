import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkLexicalContent() {
  console.log('[Check Lexical] Starting...')

  const payload = await getPayload({ config: configPromise })

  // Get a sample post with content
  const result = await payload.db.drizzle.execute(`
    SELECT id, title, content::text as content_text, excerpt::text as excerpt_text
    FROM posts
    WHERE content IS NOT NULL
    ORDER BY id DESC
    LIMIT 5
  `)

  for (const post of result.rows) {
    console.log(`\n========================================`)
    console.log(`Post ID: ${post.id}`)
    console.log(`Title: ${post.title}`)

    // Check content structure
    if (post.content_text) {
      try {
        const content = JSON.parse(post.content_text)
        console.log('\nContent Analysis:')
        console.log('  - Has root:', !!content.root)
        console.log('  - Root type:', content.root?.type || 'MISSING')
        console.log('  - Root version:', content.root?.version || 'MISSING')
        console.log('  - Root direction:', content.root?.direction || 'MISSING')
        console.log('  - Root format:', content.root?.format || 'MISSING')
        console.log('  - Root indent:', content.root?.indent || 0)
        console.log('  - Children count:', content.root?.children?.length || 0)

        // Check for common issues
        if (!content.root) {
          console.log('  ⚠️  ERROR: Missing root property!')
        }
        if (content.root?.type !== 'root') {
          console.log(`  ⚠️  ERROR: Root type is "${content.root?.type}" instead of "root"`)
        }
        if (!content.root?.children) {
          console.log('  ⚠️  ERROR: Root has no children array!')
        }

        // Check first child structure
        if (content.root?.children?.[0]) {
          const firstChild = content.root.children[0]
          console.log('\nFirst child:')
          console.log('  - Type:', firstChild.type)
          console.log('  - Tag:', firstChild.tag || 'N/A')
          console.log('  - Has children:', !!firstChild.children)

          // Check for common Lexical node types
          if (firstChild.type === 'paragraph' || firstChild.type === 'heading') {
            console.log('  - Format:', firstChild.format || 0)
            console.log('  - Direction:', firstChild.direction || 'null')
            console.log('  - Indent:', firstChild.indent || 0)
          }
        }
      } catch (e) {
        console.log(`\n⚠️  ERROR parsing content JSON: ${e.message}`)
        console.log('First 200 chars:', post.content_text?.substring(0, 200))
      }
    } else {
      console.log('\n⚠️  No content found')
    }

    // Check excerpt structure
    if (post.excerpt_text) {
      try {
        const excerpt = JSON.parse(post.excerpt_text)
        console.log('\nExcerpt Analysis:')
        console.log('  - Has root:', !!excerpt.root)
        console.log('  - Valid structure:', excerpt.root?.type === 'root')
      } catch (e) {
        console.log(`\n⚠️  ERROR parsing excerpt JSON: ${e.message}`)
      }
    }
  }

  // Check version table content
  console.log('\n\n========================================')
  console.log('Checking version table content...')

  const versionResult = await payload.db.drizzle.execute(`
    SELECT v.id, v.parent_id, v.version_content::text as content_text
    FROM _posts_v v
    WHERE v.latest = true
    AND v.version_content IS NOT NULL
    LIMIT 2
  `)

  for (const version of versionResult.rows) {
    console.log(`\nVersion ID: ${version.id}, Parent Post ID: ${version.parent_id}`)

    if (version.content_text) {
      try {
        const content = JSON.parse(version.content_text)
        console.log('  - Has root:', !!content.root)
        console.log('  - Root type:', content.root?.type || 'MISSING')
        console.log('  - Valid:', content.root?.type === 'root')
      } catch (e) {
        console.log(`  ⚠️  ERROR in version content: ${e.message}`)
      }
    }
  }

  process.exit(0)
}

checkLexicalContent().catch((error) => {
  console.error('[Check Lexical] Error:', error)
  process.exit(1)
})