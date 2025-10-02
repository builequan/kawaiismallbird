import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

async function normalizeUploadNodes() {
  const payload = await getPayload({ config })

  console.log('Starting upload node normalization...')

  // Get all posts
  const { docs: posts, totalDocs } = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0, // Don't populate anything
  })

  console.log(`Found ${totalDocs} posts to process`)

  let updatedCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      if (!post.content || !post.content.root || !post.content.root.children) {
        console.log(`Skipping post ${post.id} - no content`)
        continue
      }

      let hasChanges = false

      // Recursively normalize upload nodes
      const normalizeNode = (node: any): any => {
        if (node.type === 'upload' && node.value && typeof node.value === 'object') {
          if ('id' in node.value) {
            hasChanges = true
            console.log(`  Normalizing upload node in post ${post.id}: ${JSON.stringify(node.value).substring(0, 100)}`)
            return { ...node, value: node.value.id }
          }
        }

        if (node.children && Array.isArray(node.children)) {
          return {
            ...node,
            children: node.children.map(normalizeNode),
          }
        }

        return node
      }

      const normalizedContent = {
        ...post.content,
        root: {
          ...post.content.root,
          children: post.content.root.children.map(normalizeNode),
        },
      }

      if (hasChanges) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: normalizedContent,
          },
          depth: 0,
        })
        updatedCount++
        console.log(`✓ Updated post ${post.id} (${post.slug})`)
      } else {
        console.log(`- Skipped post ${post.id} (${post.slug}) - no changes needed`)
      }
    } catch (error) {
      errorCount++
      console.error(`✗ Error processing post ${post.id}:`, error)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total posts: ${totalDocs}`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Skipped: ${totalDocs - updatedCount - errorCount}`)

  process.exit(0)
}

normalizeUploadNodes().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
