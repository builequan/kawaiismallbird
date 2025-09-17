import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔍 Checking Post Links Status')
  console.log('==================================================')
  
  // Get posts with affiliate links
  const posts = await payload.find({
    collection: 'posts',
    limit: 5,
    where: {
      status: {
        equals: 'published'
      }
    }
  })
  
  console.log(`\nFound ${posts.docs.length} published posts\n`)
  
  for (const post of posts.docs) {
    console.log(`📝 Post: ${post.title}`)
    console.log(`   Slug: /posts/${post.slug}`)
    console.log(`   Status: ${post.status}`)
    
    if (!post.content?.root) {
      console.log('   ❌ No content found')
      continue
    }
    
    // Count affiliate links
    const contentStr = JSON.stringify(post.content)
    const affiliateLinkCount = (contentStr.match(/"type":"link".*?"a8\.net|"type":"link".*?"rakuten/g) || []).length
    const cartIconCount = (contentStr.match(/🛒/g) || []).length
    
    console.log(`   🔗 Affiliate links: ${affiliateLinkCount}`)
    console.log(`   🛒 Cart icons: ${cartIconCount}`)
    
    // Show sample link if exists
    const linkMatch = contentStr.match(/"type":"link".*?"fields":\{.*?\}/)
    if (linkMatch) {
      console.log(`   📦 Sample link structure: ${linkMatch[0].substring(0, 100)}...`)
    }
    
    console.log('')
  }
  
  await payload.db.destroy()
}

main().catch(console.error)