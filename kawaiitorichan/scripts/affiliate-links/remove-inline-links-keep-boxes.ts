import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

/**
 * Remove inline affiliate links but keep recommendation boxes
 */
function removeInlineLinksOnly(content: any): { modified: boolean; linksRemoved: number; content: any } {
  if (!content?.root) return { modified: false, linksRemoved: 0, content }
  
  let linksRemoved = 0
  let inRecommendationSection = false
  
  function processNode(node: any): any {
    if (!node) return node
    
    // Check if we're entering a recommendation section
    if (node.type === 'heading' && node.children?.[0]?.text === 'おすすめ商品') {
      inRecommendationSection = true
      return node // Keep the heading
    }
    
    // Check if we're exiting the recommendation section
    if (node.type === 'horizontalrule') {
      inRecommendationSection = false
      return node
    }
    
    // If it's an affiliate link and NOT in recommendation section, convert to plain text
    if (!inRecommendationSection && node.type === 'link' && node.fields?.url && 
        (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
      
      // Skip if it's part of a product box (has 🛒 or specific format)
      const linkText = node.children?.[0]?.text || ''
      if (linkText.includes('🛒') || linkText.includes('詳細を見る') || linkText.includes('を見る')) {
        // This is likely part of a product box, keep it
        return node
      }
      
      // Convert inline link to plain text
      linksRemoved++
      return {
        type: 'text',
        text: node.children?.[0]?.text || '',
        version: 1
      }
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(child => processNode(child))
    }
    
    return node
  }
  
  const newContent = JSON.parse(JSON.stringify(content))
  processNode(newContent.root)
  
  return {
    modified: linksRemoved > 0,
    linksRemoved,
    content: newContent
  }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🧹 Removing Inline Affiliate Links (Keeping Product Boxes)')
  console.log('==================================================\n')
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0
  })
  
  const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
  console.log(`Found ${publishedPosts.length} published posts\n`)
  
  let totalLinksRemoved = 0
  let postsModified = 0
  const batchSize = 5
  
  for (let i = 0; i < publishedPosts.length; i += batchSize) {
    const batch = publishedPosts.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (post: any) => {
      if (!post.content?.root) return
      
      const result = removeInlineLinksOnly(post.content)
      
      if (result.modified) {
        try {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: result.content
            }
          })
          
          console.log(`📝 ${post.title}: Removed ${result.linksRemoved} inline links`)
          totalLinksRemoved += result.linksRemoved
          postsModified++
        } catch (error) {
          console.error(`❌ Failed to update ${post.title}: ${error}`)
        }
      }
    }))
    
    console.log(`Progress: ${Math.min(i + batchSize, publishedPosts.length)}/${publishedPosts.length}`)
  }
  
  console.log('\n==================================================')
  console.log(`✨ Cleanup Complete!`)
  console.log(`   Posts modified: ${postsModified}`)
  console.log(`   Inline links removed: ${totalLinksRemoved}`)
  console.log(`   Product boxes: Preserved`)
  console.log('==================================================\n')
  
  await payload.db.destroy()
}

main().catch(console.error)