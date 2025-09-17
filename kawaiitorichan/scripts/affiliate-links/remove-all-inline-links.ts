import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Remove ALL affiliate links from article content
 * Keep only the showcase boxes at the bottom
 */

async function removeAllInlineAffiliateLinks() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🧹 Removing ALL Inline Affiliate Links')
  console.log('=' .repeat(50))
  console.log('📝 Strategy:')
  console.log('  • Remove all affiliate links from article text')
  console.log('  • Keep showcase boxes at the bottom')
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
  let totalLinksRemoved = 0
  
  for (const post of posts.docs) {
    try {
      if (!post.content?.root?.children?.length) {
        continue
      }
      
      const content = JSON.parse(JSON.stringify(post.content))
      let linksRemoved = 0
      
      // Process each node to remove affiliate links
      for (const node of content.root.children) {
        // Skip showcase section (keep it)
        if (node.type === 'heading' && 
            node.children?.[0]?.text?.includes('おすすめゴルフ用品')) {
          break // Stop processing when we reach the showcase
        }
        
        if (node.children && Array.isArray(node.children)) {
          const newChildren = []
          
          for (const child of node.children) {
            if (child.type === 'link') {
              // Check if it's an affiliate link
              const isAffiliate = child.fields?.rel?.includes('sponsored') || 
                                 child.fields?.url?.includes('a8.net') || 
                                 child.fields?.url?.includes('rakuten') ||
                                 child.fields?.url?.includes('//af.moshimo.com')
              
              if (isAffiliate) {
                // Replace affiliate link with plain text
                linksRemoved++
                if (child.children && child.children[0]) {
                  // Keep the text but remove the link
                  newChildren.push({
                    type: 'text',
                    text: child.children[0].text || '',
                    format: child.children[0].format || 0,
                    version: 1
                  })
                }
              } else {
                // Keep non-affiliate links (internal links)
                newChildren.push(child)
              }
            } else {
              newChildren.push(child)
            }
          }
          
          node.children = newChildren
        }
      }
      
      // Only update if we removed links
      if (linksRemoved > 0) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: content
          },
          depth: 0
        })
        
        processed++
        totalLinksRemoved += linksRemoved
        console.log(`✅ ${post.title}: Removed ${linksRemoved} affiliate links`)
      }
      
    } catch (error: any) {
      console.error(`❌ Error processing "${post.title}":`, error.message)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 COMPLETE')
  console.log('=' .repeat(50))
  console.log(`✅ Processed: ${processed} posts`)
  console.log(`🗑️  Total affiliate links removed: ${totalLinksRemoved}`)
  console.log('\n✨ Result:')
  console.log('  • NO affiliate links in article text')
  console.log('  • Showcase boxes remain at the bottom')
  console.log('  • Internal navigation links preserved')
}

removeAllInlineAffiliateLinks().catch(console.error)