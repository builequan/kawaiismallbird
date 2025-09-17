import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs'
import * as path from 'path'

interface Product {
  id: number
  product_name: string
  anchorPhrases: string[]
  affiliate_url: string
  price: string
  status: string
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🛍️  Testing Affiliate Links')
  console.log('==================================================')
  
  // Load products
  const filePath = path.join(process.cwd(), 'data/affiliate-links/products-index.json')
  const data = fs.readFileSync(filePath, 'utf8')
  const products = JSON.parse(data).filter((p: Product) => p.status === 'active')
  console.log(`📦 Loaded ${products.length} active products`)
  
  // Show sample products
  console.log('\nSample products:')
  products.slice(0, 5).forEach((p: Product) => {
    console.log(`- ${p.product_name.substring(0, 50)}...`)
    console.log(`  Keywords: ${p.anchorPhrases.slice(0, 3).join(', ')}`)
  })
  
  // Test on first 3 posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    depth: 0
  })
  
  console.log(`\n📄 Testing on ${posts.docs.length} posts`)
  console.log('==================================================')
  
  for (const post of posts.docs) {
    console.log(`\n📝 Post: ${post.title}`)
    
    // Extract text content
    const content = JSON.stringify(post.content_html || {})
    
    // Find matching keywords
    const matches: string[] = []
    for (const product of products) {
      for (const phrase of product.anchorPhrases) {
        if (content.toLowerCase().includes(phrase.toLowerCase())) {
          matches.push(phrase)
          if (matches.length >= 6) break
        }
      }
      if (matches.length >= 6) break
    }
    
    console.log(`   Found ${matches.length} potential matches:`)
    matches.slice(0, 6).forEach(m => console.log(`   - ${m}`))
  }
  
  await payload.db.destroy()
}

main().catch(console.error)