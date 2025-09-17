import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Final cleanup - Remove ALL affiliate links everywhere
 * Keep only the showcase section structure without making them clickable
 */

async function finalCleanup() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🧹 FINAL CLEANUP - Removing ALL Affiliate Links')
  console.log('=' .repeat(50))
  console.log('📝 This will:')
  console.log('  • Remove ALL affiliate links from content')
  console.log('  • Remove ALL affiliate links from showcase')  
  console.log('  • Keep product names as plain text in showcase')
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
  
  console.log(`\n📄 Processing ${posts.docs.length} posts\n`)
  
  let processed = 0
  
  for (const post of posts.docs) {
    try {
      if (!post.content?.root?.children?.length) {
        continue
      }
      
      const content = JSON.parse(JSON.stringify(post.content))
      let modified = false
      
      // Process ALL nodes to remove ALL affiliate links
      for (let i = 0; i < content.root.children.length; i++) {
        const node = content.root.children[i]
        
        if (node.children && Array.isArray(node.children)) {
          const newChildren = []
          
          for (const child of node.children) {
            if (child.type === 'link') {
              // Check if it's an affiliate link
              const url = child.fields?.url || ''
              const rel = child.fields?.rel || ''
              const isAffiliate = rel.includes('sponsored') || 
                                 url.includes('a8.net') || 
                                 url.includes('rakuten') ||
                                 url.includes('moshimo') ||
                                 url.includes('af.') ||
                                 url.includes('affiliate')
              
              if (isAffiliate) {
                modified = true
                // Replace with plain text
                if (child.children && child.children[0]) {
                  // For showcase items, keep the arrow but make text plain
                  const text = child.children[0].text || ''
                  newChildren.push({
                    type: 'text',
                    text: text,
                    format: child.children[0].format || 0,
                    version: 1
                  })
                }
              } else {
                // Keep internal links
                newChildren.push(child)
              }
            } else {
              newChildren.push(child)
            }
          }
          
          node.children = newChildren
        }
      }
      
      // Update if modified
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
        console.log(`✅ Cleaned: ${post.title}`)
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing "${post.title}":`, error.message)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 COMPLETE')
  console.log('=' .repeat(50))
  console.log(`✅ Processed: ${processed} posts`)
  console.log('\n✨ Final Result:')
  console.log('  • NO clickable affiliate links anywhere')
  console.log('  • Product names shown as plain text in showcase')
  console.log('  • Internal links preserved')
}

finalCleanup().catch(console.error)