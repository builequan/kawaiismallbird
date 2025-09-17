import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function fixDuplicateTitles() {
  console.log('Starting to fix duplicate titles in posts...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  console.log(`Found ${posts.totalDocs} posts to check`)
  
  let fixedCount = 0
  let skippedCount = 0
  
  for (const post of posts.docs) {
    // Check if first node is an H1 heading that matches the title
    if (post.content?.root?.children?.[0]?.type === 'heading' && 
        post.content?.root?.children?.[0]?.tag === 'h1') {
      
      const h1Text = post.content.root.children[0].children?.[0]?.text
      
      if (h1Text === post.title) {
        console.log(`Fixing duplicate H1 title in post: ${post.title}`)
        
        // Remove the first H1 node
        const newChildren = post.content.root.children.slice(1)
        
        // Make sure we have at least one child node
        if (newChildren.length === 0) {
          console.log(`  Skipping: Would result in empty content`)
          skippedCount++
          continue
        }
        
        const updatedContent = {
          ...post.content,
          root: {
            ...post.content.root,
            children: newChildren
          }
        }
        
        try {
          // Update the post
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: updatedContent,
            },
          })
          
          fixedCount++
        } catch (error) {
          console.error(`  Failed to update post ${post.id}:`, error)
          skippedCount++
        }
      } else {
        console.log(`H1 found but doesn't match title in post: ${post.title}`)
        console.log(`  Title: "${post.title}"`)
        console.log(`  H1: "${h1Text}"`)
        skippedCount++
      }
    }
  }
  
  console.log('\n=== Summary ===')
  console.log(`Total posts checked: ${posts.totalDocs}`)
  console.log(`Posts fixed: ${fixedCount}`)
  console.log(`Posts skipped: ${skippedCount}`)
  console.log(`Posts without H1: ${posts.totalDocs - fixedCount - skippedCount}`)
  
  process.exit(0)
}

fixDuplicateTitles().catch((error) => {
  console.error('Error fixing duplicate titles:', error)
  process.exit(1)
})