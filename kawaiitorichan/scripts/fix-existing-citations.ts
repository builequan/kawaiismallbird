import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Fix citation links in existing posts
 * Converts [[number]](url) markdown format to proper Lexical link nodes
 */

// Parse and fix citations in Lexical content
function fixCitationsInContent(content: any): { content: any; fixed: boolean } {
  if (!content) return { content, fixed: false }

  let fixed = false

  const processNode = (node: any): any => {
    if (!node) return node

    // Process text nodes that might contain citation markdown
    if (node.type === 'text' && node.text && typeof node.text === 'string') {
      const text = node.text

      // Check if text contains citation pattern [[number]](url)
      const citationPattern = /\[\[(\d+)\]\]\((https?:\/\/[^)]+)\)/g

      if (citationPattern.test(text)) {
        fixed = true
        const parts: any[] = []
        let lastIndex = 0
        const regex = /\[\[(\d+)\]\]\((https?:\/\/[^)]+)\)/g
        let match

        while ((match = regex.exec(text)) !== null) {
          // Add text before the citation
          if (match.index > lastIndex) {
            parts.push({
              type: 'text',
              version: 1,
              text: text.substring(lastIndex, match.index)
            })
          }

          // Add citation as link node
          parts.push({
            type: 'link',
            version: 2,
            fields: {
              linkType: 'custom',
              url: match[2],
              newTab: true,
            },
            children: [
              {
                type: 'text',
                version: 1,
                text: `[${match[1]}]`
              }
            ]
          })

          lastIndex = regex.lastIndex
        }

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push({
            type: 'text',
            version: 1,
            text: text.substring(lastIndex)
          })
        }

        return parts
      }
    }

    // Process arrays (like paragraph children)
    if (Array.isArray(node)) {
      const processed = node.flatMap(processNode)
      return processed
    }

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      const newChildren = node.children.flatMap(processNode)
      if (JSON.stringify(newChildren) !== JSON.stringify(node.children)) {
        fixed = true
      }
      return { ...node, children: newChildren }
    }

    return node
  }

  const fixedContent = processNode(content)
  return { content: fixedContent, fixed }
}

async function fixExistingCitations() {
  console.log('🔧 Starting citation fix for existing posts...\n')

  const payload = await getPayload({ config })

  // Get all posts
  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })

  console.log(`📊 Found ${posts.length} posts to check\n`)

  let fixedCount = 0
  let checkedCount = 0

  for (const post of posts) {
    checkedCount++

    // Check if content has citation pattern
    const contentStr = JSON.stringify(post.content)
    if (!contentStr.includes('[[') || !contentStr.includes(']]')) {
      continue
    }

    console.log(`Checking post ${checkedCount}/${posts.length}: "${post.title}"`)

    // Fix citations
    const { content: fixedContent, fixed } = fixCitationsInContent(post.content)

    if (fixed) {
      console.log(`  ✅ Fixing citations in post ID ${post.id}`)

      try {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: fixedContent
          },
        })
        fixedCount++
        console.log(`  ✅ Successfully fixed post "${post.title}"\n`)
      } catch (error) {
        console.error(`  ❌ Error fixing post "${post.title}":`, error)
      }
    }
  }

  console.log('\n✨ Citation fix complete!')
  console.log(`📊 Checked: ${checkedCount} posts`)
  console.log(`📊 Fixed: ${fixedCount} posts with citation issues`)

  process.exit(0)
}

fixExistingCitations().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})