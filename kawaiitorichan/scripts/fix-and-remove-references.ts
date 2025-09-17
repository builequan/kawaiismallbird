import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function fixAndRemoveReferences() {
  const payload = await getPayload({ config: configPromise })

  console.log('Starting to fix and remove reference sections from all posts...')

  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 2,
  })

  console.log(`Found ${posts.docs.length} posts to process`)

  let updatedCount = 0
  let errors = 0

  for (const post of posts.docs) {
    try {
      if (!post.content || !post.content.root || !post.content.root.children) {
        continue
      }

      let modified = false
      const newChildren: any[] = []
      let skipRemainingContent = false

      // Process each child node
      for (let i = 0; i < post.content.root.children.length; i++) {
        const child = post.content.root.children[i]

        // Check if this is a references heading
        if (child.type === 'heading') {
          const headingText = extractText(child)

          // Check for reference sections (including duplicated text)
          if (headingText && (
            headingText.includes('出典') ||
            headingText.includes('参考文献') ||
            headingText.includes('参考資料') ||
            headingText.includes('References') ||
            headingText.includes('リンク')
          )) {
            console.log(`  - Found references section in post: ${post.title}`)
            console.log(`    Heading text: "${headingText}"`)

            // Skip this heading and all content after it
            skipRemainingContent = true
            modified = true
            continue
          }
        }

        // If we've found a references section, skip all remaining content
        if (skipRemainingContent) {
          modified = true
          continue
        }

        // Fix duplicated text in headings
        if (child.type === 'heading' && child.children) {
          let headingModified = false
          const newHeadingChildren = child.children.map((textNode: any) => {
            if (textNode.type === 'text' && textNode.text) {
              // Check for duplicated text patterns
              const text = textNode.text
              const patterns = [
                /^(.+?)\1$/,  // Exact duplication
                /^(.{3,}?)\1+$/  // Repeated patterns
              ]

              for (const pattern of patterns) {
                const match = text.match(pattern)
                if (match) {
                  console.log(`    Fixed duplicated heading text: "${text}" -> "${match[1]}"`)
                  headingModified = true
                  return {
                    ...textNode,
                    text: match[1]
                  }
                }
              }
            }
            return textNode
          })

          if (headingModified) {
            modified = true
            newChildren.push({
              ...child,
              children: newHeadingChildren
            })
          } else {
            newChildren.push(child)
          }
        } else {
          // Keep this node as is
          newChildren.push(child)
        }
      }

      if (modified) {
        // Create completely new content structure
        const updatedContent = {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: newChildren,
            direction: post.content.root.direction || null
          }
        }

        // Update the post with user context
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
          user: 1, // Use admin user ID
          overrideAccess: true,
          draft: false
        })

        console.log(`✅ Updated post: ${post.title}`)
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ Error processing post ${post.title}:`, error)
      errors++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total posts processed: ${posts.docs.length}`)
  console.log(`Posts updated: ${updatedCount}`)
  console.log(`Errors: ${errors}`)
}

// Helper function to extract text from a node
function extractText(node: any): string {
  if (!node) return ''

  if (node.type === 'text') {
    return node.text || ''
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }

  return ''
}

fixAndRemoveReferences()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })