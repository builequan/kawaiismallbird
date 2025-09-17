import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Remove product showcase sections from all posts
 * Keep inline affiliate links intact
 */

async function removeProductShowcases() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🧹 Removing Product Showcase Sections')
  console.log('=' .repeat(50))
  
  // Get all published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' }
    },
    limit: 1000,
    depth: 0
  })
  
  console.log(`📄 Processing ${posts.docs.length} posts`)
  
  let processed = 0
  let removed = 0
  
  for (const post of posts.docs) {
    try {
      if (!post.content?.root?.children?.length) {
        continue
      }
      
      const content = JSON.parse(JSON.stringify(post.content))
      let modified = false
      
      // Find and remove showcase section
      let showcaseIndex = -1
      for (let i = content.root.children.length - 1; i >= 0; i--) {
        const node = content.root.children[i]
        
        // Look for the showcase heading
        if (node.type === 'heading' && 
            node.children?.[0]?.text?.includes('おすすめ')) {
          showcaseIndex = i
          modified = true
          break
        }
      }
      
      // Remove everything from showcase heading onwards
      if (showcaseIndex >= 0) {
        // Also check if there's an empty paragraph before the heading
        if (showcaseIndex > 0) {
          const prevNode = content.root.children[showcaseIndex - 1]
          if (prevNode?.type === 'paragraph' && 
              (!prevNode.children?.length || 
               (prevNode.children.length === 1 && prevNode.children[0]?.text === ''))) {
            // Start removal from the empty paragraph
            content.root.children = content.root.children.slice(0, showcaseIndex - 1)
          } else {
            content.root.children = content.root.children.slice(0, showcaseIndex)
          }
        } else {
          content.root.children = content.root.children.slice(0, showcaseIndex)
        }
        
        removed++
      }
      
      // Update the post if modified
      if (modified) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: content
          },
          depth: 0
        })
        
        processed++
        console.log(`✅ Removed showcase from: ${post.title}`)
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing "${post.title}":`, error.message)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 COMPLETE')
  console.log('=' .repeat(50))
  console.log(`✅ Processed: ${processed} posts`)
  console.log(`🗑️  Showcases removed: ${removed}`)
  console.log('\n💡 Inline affiliate links remain intact in article text')
}

removeProductShowcases().catch(console.error)