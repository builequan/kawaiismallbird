import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { processContentWithTables } from '../src/utilities/table-node-handler'

async function fixTableNodes() {
  console.log('Starting to fix table nodes in posts...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })
  
  console.log(`Found ${posts.totalDocs} posts to check`)
  
  let fixedCount = 0
  let errorCount = 0
  
  for (const post of posts.docs) {
    // Check if content has table nodes
    let hasTableNodes = false
    
    if (post.content?.root?.children) {
      hasTableNodes = post.content.root.children.some((node: any) => node.type === 'table')
    }
    
    if (hasTableNodes) {
      console.log(`Fixing table nodes in post: ${post.title}`)
      
      try {
        // Process content to convert table nodes
        const processedContent = processContentWithTables(post.content)
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: processedContent,
          },
        })
        
        console.log(`  ✓ Fixed successfully`)
        fixedCount++
      } catch (error: any) {
        console.error(`  ✗ Failed to update:`, error.message || error)
        errorCount++
      }
    }
  }
  
  console.log('\n=== Summary ===')
  console.log(`Total posts checked: ${posts.totalDocs}`)
  console.log(`Posts fixed: ${fixedCount}`)
  console.log(`Posts with errors: ${errorCount}`)
  console.log(`Posts without tables: ${posts.totalDocs - fixedCount - errorCount}`)
  
  process.exit(0)
}

fixTableNodes().catch((error) => {
  console.error('Error fixing table nodes:', error)
  process.exit(1)
})