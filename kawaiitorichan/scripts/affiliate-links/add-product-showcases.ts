import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface Product {
  id: number
  product_name: string
  keyword_research: string
  keywords: string[]
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
  language: string
}

async function loadProducts(): Promise<Product[]> {
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  console.log(`✅ Loaded ${products.length} products`)
  return products
}

function extractText(node: any, texts: string[] = []): string[] {
  if (!node) return texts
  
  if (node.type === 'text' && node.text) {
    texts.push(node.text)
  }
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractText(child, texts)
    }
  }
  
  return texts
}

function findBestProducts(content: string, products: Product[], limit: number = 3): Product[] {
  const contentLower = content.toLowerCase()
  const matches: { product: Product; score: number }[] = []
  
  // Score products based on relevance
  for (const product of products) {
    let score = 0
    
    // Check primary keyword
    if (product.keyword_research && contentLower.includes(product.keyword_research.toLowerCase())) {
      score += 10
    }
    
    // Check secondary keywords
    for (const keyword of product.keywords || []) {
      if (keyword && keyword.length > 2 && contentLower.includes(keyword.toLowerCase())) {
        score += 5
      }
    }
    
    // Check anchor phrases
    for (const phrase of product.anchorPhrases || []) {
      if (phrase && phrase.length > 3 && contentLower.includes(phrase.toLowerCase())) {
        score += 2
      }
    }
    
    // Boost for common golf terms
    const golfTypes = ['ドライバー', 'アイアン', 'パター', 'ウェッジ', 'ボール', 'グローブ', 'シューズ']
    for (const type of golfTypes) {
      if (product.product_name.includes(type) && contentLower.includes(type.toLowerCase())) {
        score += 3
      }
    }
    
    if (score > 0) {
      matches.push({ product, score })
    }
  }
  
  // Sort by score
  matches.sort((a, b) => b.score - a.score)
  
  // Get top products
  let selected = matches.slice(0, limit).map(m => m.product)
  
  // If not enough matches, add some popular products
  if (selected.length < limit) {
    const popularProducts = products.filter(p => 
      (p.product_name.includes('ボール') || 
       p.product_name.includes('クラブ') || 
       p.product_name.includes('グローブ')) &&
      !selected.some(s => s.id === p.id)
    )
    
    selected = selected.concat(popularProducts.slice(0, limit - selected.length))
  }
  
  return selected.slice(0, limit)
}

function addProductShowcase(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  // Create a deep copy
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Check if showcase already exists
  const lastNodes = newContent.root.children.slice(-5)
  const hasShowcase = lastNodes.some((node: any) => 
    node.type === 'heading' && 
    node.children?.[0]?.text?.includes('おすすめ')
  )
  
  if (hasShowcase) {
    console.log('  ⚠️  Showcase already exists, skipping')
    return content
  }
  
  // Add separator
  newContent.root.children.push({
    type: 'paragraph',
    version: 1,
    children: [{
      type: 'text',
      text: '',
      format: 0,
      version: 1
    }]
  })
  
  // Add heading
  newContent.root.children.push({
    type: 'heading',
    version: 1,
    tag: 'h3',
    children: [{
      type: 'text',
      text: 'おすすめゴルフ用品',
      format: 0,
      version: 1
    }]
  })
  
  // Add product recommendations
  for (const product of products) {
    const url = product.clean_url || product.affiliate_url
    const productName = product.product_name.length > 60 
      ? product.product_name.substring(0, 60) + '...' 
      : product.product_name
    
    // Product paragraph with link
    newContent.root.children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: '▶ ',
          format: 1,
          version: 1
        },
        {
          type: 'link',
          version: 1,
          fields: {
            url: url,
            newTab: true,
            rel: 'nofollow sponsored'
          },
          children: [{
            type: 'text',
            text: productName,
            format: 0,
            version: 1
          }]
        }
      ]
    })
    
    // Price info
    if (product.price) {
      newContent.root.children.push({
        type: 'paragraph',
        version: 1,
        children: [{
          type: 'text',
          text: `価格: ${product.price}`,
          format: 0,
          version: 1
        }]
      })
    }
  }
  
  return newContent
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🚀 Starting to add product showcases to posts...')
    
    // Load products
    const products = await loadProducts()
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000,
      depth: 0
    })
    
    console.log(`📝 Found ${posts.docs.length} published posts`)
    
    let processed = 0
    let skipped = 0
    let errors = 0
    
    for (const post of posts.docs) {
      try {
        // Skip if no content
        if (!post.content?.root?.children?.length) {
          console.log(`⏭️  Skipping "${post.title}" - no content`)
          skipped++
          continue
        }
        
        // Extract text content for matching
        const textContent = extractText(post.content.root).join(' ')
        
        if (textContent.length < 100) {
          console.log(`⏭️  Skipping "${post.title}" - content too short`)
          skipped++
          continue
        }
        
        // Find best matching products based on content
        const matchedProducts = findBestProducts(textContent, products, 3)
        
        if (matchedProducts.length === 0) {
          console.log(`⏭️  Skipping "${post.title}" - no matching products`)
          skipped++
          continue
        }
        
        console.log(`🔗 Adding showcase to "${post.title}" with ${matchedProducts.length} products`)
        
        // Add product showcase at the end
        const updatedContent = addProductShowcase(post.content, matchedProducts)
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent
          },
          depth: 0
        })
        
        processed++
        console.log(`✅ Updated "${post.title}"`)
        
      } catch (error: any) {
        console.error(`❌ Error processing "${post.title}":`, error.message)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 PROCESSING COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log(`⏭️  Skipped: ${skipped} posts`)
    console.log(`❌ Errors: ${errors} posts`)
    console.log(`📈 Success rate: ${((processed / posts.docs.length) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()