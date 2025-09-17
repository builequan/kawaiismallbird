import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function removeReferenceSections() {
  const payload = await getPayload({ config: configPromise })

  console.log('Starting to remove reference sections from all posts...')

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
      let skipNext = false
      let inReferencesSection = false

      // Process each child node
      for (let i = 0; i < post.content.root.children.length; i++) {
        const child = post.content.root.children[i]

        // Check if this is a references heading
        if (child.type === 'heading') {
          const headingText = extractText(child)
          if (headingText && (
            headingText.includes('出典') ||
            headingText.includes('参考文献') ||
            headingText.includes('参考資料') ||
            headingText.includes('References') ||
            headingText.includes('リンク')
          )) {
            console.log(`  - Found references section in post: ${post.title}`)
            inReferencesSection = true
            modified = true
            continue // Skip this heading
          } else {
            // Different section, stop skipping
            inReferencesSection = false
          }
        }

        // Skip content in references section
        if (inReferencesSection) {
          // Skip lists that follow reference headings
          if (child.type === 'list' || child.type === 'paragraph') {
            const text = extractText(child)
            // Check if this looks like reference content
            if (text && (text.includes('http') || text.includes('リンク') || /^\d+[\.\)]/.test(text))) {
              modified = true
              continue // Skip this content
            } else if (child.type === 'list') {
              // Skip all lists in reference sections
              modified = true
              continue
            } else {
              // This might be the start of new content, stop skipping
              inReferencesSection = false
            }
          }
        }

        // Keep this node
        newChildren.push(child)
      }

      if (modified) {
        // Update the post
        const updatedContent = {
          root: {
            ...post.content.root,
            children: newChildren
          }
        }

        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
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

removeReferenceSections()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })