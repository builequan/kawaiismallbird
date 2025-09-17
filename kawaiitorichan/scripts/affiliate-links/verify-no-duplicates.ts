import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔍 Verifying No Duplicate Links')
  console.log('==================================================\n')
  
  // Get a sample post to check in detail
  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    depth: 0
  })
  
  for (const post of posts.docs) {
    if ((post as any)._status !== 'published') continue
    if (!post.content?.root) continue
    
    console.log(`\n📝 ${post.title}`)
    
    // Track all links
    const linkMap = new Map<string, { count: number, urls: Set<string> }>()
    
    function traverseNode(node: any) {
      if (!node) return
      
      if (node.type === 'link' && node.fields?.url) {
        const url = node.fields.url
        const text = node.children?.[0]?.text || ''
        
        // Only check affiliate links
        if (url.includes('a8.net') || url.includes('rakuten')) {
          const key = text.toLowerCase().trim()
          
          if (!linkMap.has(key)) {
            linkMap.set(key, { count: 0, urls: new Set() })
          }
          
          const entry = linkMap.get(key)!
          entry.count++
          entry.urls.add(url)
        }
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverseNode)
      }
    }
    
    traverseNode(post.content.root)
    
    // Check for duplicates
    const duplicates = Array.from(linkMap.entries())
      .filter(([, data]) => data.count > 1)
    
    if (duplicates.length > 0) {
      console.log('   ⚠️  DUPLICATES FOUND:')
      duplicates.forEach(([text, data]) => {
        console.log(`      "${text}": appears ${data.count} times`)
        if (data.urls.size > 1) {
          console.log(`         (links to ${data.urls.size} different URLs)`)
        }
      })
    } else {
      const totalLinks = Array.from(linkMap.values())
        .reduce((sum, data) => sum + data.count, 0)
      console.log(`   ✅ No duplicates (${totalLinks} unique affiliate links)`)
    }
  }
  
  console.log('\n==================================================\n')
  await payload.db.destroy()
}

main().catch(console.error)