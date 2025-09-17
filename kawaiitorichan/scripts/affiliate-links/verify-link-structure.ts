import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔍 Verifying Affiliate Link Structure')
  console.log('==================================================')
  
  // Get a sample post to check structure
  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    depth: 0
  })
  
  for (const post of posts.docs) {
    console.log(`\n📝 Post: ${post.title}`)
    console.log('-----------------------------------')
    
    if (!post.content?.root) {
      console.log('   ❌ No content found')
      continue
    }
    
    // Check for shopping cart icons
    const contentStr = JSON.stringify(post.content, null, 2)
    const cartIcons = (contentStr.match(/🛒/g) || []).length
    console.log(`   🛒 Shopping cart icons found: ${cartIcons}`)
    
    // Check for actual link nodes
    let linkCount = 0
    let affiliateLinkCount = 0
    let linkWithCartCount = 0
    
    function checkNode(node: any, depth: number = 0) {
      if (node.type === 'link') {
        linkCount++
        const url = node.fields?.url || ''
        const children = JSON.stringify(node.children || [])
        
        if (url.includes('a8.net') || url.includes('rakuten')) {
          affiliateLinkCount++
          console.log(`   🔗 Affiliate link found:`)
          console.log(`      URL: ${url.substring(0, 50)}...`)
          console.log(`      Has cart icon: ${children.includes('🛒')}`)
          
          if (children.includes('🛒')) {
            linkWithCartCount++
          }
        }
        
        // Show structure of first link
        if (affiliateLinkCount === 1) {
          console.log(`   📦 Sample link structure:`)
          console.log(JSON.stringify(node, null, 4).split('\n').slice(0, 15).join('\n'))
        }
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => checkNode(child, depth + 1))
      }
    }
    
    checkNode(post.content.root)
    
    console.log(`\n   📊 Summary:`)
    console.log(`      Total links: ${linkCount}`)
    console.log(`      Affiliate links: ${affiliateLinkCount}`)
    console.log(`      Links with cart icon: ${linkWithCartCount}`)
    
    // Check for orphaned cart icons (not in links)
    const plainTextWithCart = contentStr.match(/"text":\s*"[^"]*🛒[^"]*"/g) || []
    const orphanedCarts = plainTextWithCart.filter(match => {
      // Check if this text is not inside a link
      const textContent = match.match(/"text":\s*"([^"]*)"/)?.[1] || ''
      return !textContent.includes('http')
    })
    
    if (orphanedCarts.length > 0) {
      console.log(`   ⚠️  Orphaned cart icons (not in links): ${orphanedCarts.length}`)
      console.log(`      Sample: ${orphanedCarts[0]?.substring(0, 50)}...`)
    }
  }
  
  await payload.db.destroy()
}

main().catch(console.error)