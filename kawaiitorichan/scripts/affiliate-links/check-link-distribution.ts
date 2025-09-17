import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔍 Checking Affiliate Link Distribution')
  console.log('==================================================\n')
  
  // Get a sample of posts to check
  const posts = await payload.find({
    collection: 'posts',
    limit: 10,
    depth: 0
  })
  
  const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
  
  for (const post of publishedPosts) {
    if (!post.content?.root) continue
    
    console.log(`\n📝 ${post.title}`)
    console.log(`   Slug: /posts/${post.slug}`)
    
    // Extract all affiliate links with their text
    const links = new Map<string, number>()
    
    function findLinks(node: any) {
      if (!node) return
      
      if (node.type === 'link' && node.fields?.url && 
          (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
        const text = node.children?.[0]?.text || ''
        links.set(text, (links.get(text) || 0) + 1)
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(findLinks)
      }
    }
    
    findLinks(post.content.root)
    
    const totalLinks = Array.from(links.values()).reduce((a, b) => a + b, 0)
    const duplicates = Array.from(links.entries()).filter(([, count]) => count > 1)
    
    console.log(`   Total affiliate links: ${totalLinks}`)
    console.log(`   Unique link texts: ${links.size}`)
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Duplicate links found:`)
      duplicates.forEach(([text, count]) => {
        console.log(`      - "${text}": ${count} times`)
      })
    } else {
      console.log(`   ✅ No duplicate links`)
    }
    
    // Show top 5 linked terms
    const sortedLinks = Array.from(links.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (sortedLinks.length > 0) {
      console.log(`   Top linked terms:`)
      sortedLinks.forEach(([text, count]) => {
        console.log(`      - "${text}": ${count}x`)
      })
    }
  }
  
  // Get overall stats
  const allPosts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0
  })
  
  const publishedAll = allPosts.docs.filter((p: any) => p._status === 'published')
  let postsWithLinks = 0
  let totalLinksCount = 0
  
  for (const post of publishedAll) {
    if (!post.content?.root) continue
    
    const contentStr = JSON.stringify(post.content)
    const affiliateLinks = (contentStr.match(/"type":"link".*?"a8\.net|"type":"link".*?"rakuten/g) || [])
    
    if (affiliateLinks.length > 0) {
      postsWithLinks++
      totalLinksCount += affiliateLinks.length
    }
  }
  
  console.log('\n==================================================')
  console.log('📊 Overall Statistics:')
  console.log(`   Total published posts: ${publishedAll.length}`)
  console.log(`   Posts with affiliate links: ${postsWithLinks}`)
  console.log(`   Total affiliate links: ${totalLinksCount}`)
  console.log(`   Average links per post: ${(totalLinksCount / postsWithLinks).toFixed(1)}`)
  console.log(`   Coverage: ${((postsWithLinks / publishedAll.length) * 100).toFixed(0)}%`)
  console.log('==================================================\n')
  
  await payload.db.destroy()
}

main().catch(console.error)