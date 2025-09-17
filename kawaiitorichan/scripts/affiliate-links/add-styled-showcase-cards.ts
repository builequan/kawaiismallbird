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
  anchorPhrases?: string[]
  affiliate_url: string
  clean_url?: string
  price: string
}

async function loadProducts(): Promise<Product[]> {
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  return products
}

/**
 * Extract text content for matching
 */
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

/**
 * Find best products for showcase
 */
function findBestProducts(textContent: string, products: Product[]): Product[] {
  const matches: { product: Product; score: number }[] = []
  const contentLower = textContent.toLowerCase()
  
  for (const product of products) {
    let score = 0
    
    // Check keywords
    if (product.keyword_research && contentLower.includes(product.keyword_research.toLowerCase())) {
      score += 10
    }
    
    if (product.keywords && Array.isArray(product.keywords)) {
      for (const keyword of product.keywords.slice(0, 3)) {
        if (keyword && contentLower.includes(keyword.toLowerCase())) {
          score += 5
        }
      }
    }
    
    // Boost for common golf terms
    const golfTypes = ['ゴルフ', 'ドライバー', 'アイアン', 'パター', 'ウェッジ', 'ボール', 'グローブ', 'シューズ', 'クラブ']
    for (const type of golfTypes) {
      if (product.product_name.includes(type) && contentLower.includes(type.toLowerCase())) {
        score += 3
      }
    }
    
    if (score > 0) {
      matches.push({ product, score })
    }
  }
  
  // Sort by score and get top 3
  matches.sort((a, b) => b.score - a.score)
  let selected = matches.slice(0, 3).map(m => m.product)
  
  // If not enough, add some popular products
  if (selected.length < 3) {
    const remaining = products.filter(p => !selected.some(s => s.id === p.id))
    selected = selected.concat(remaining.slice(0, 3 - selected.length))
  }
  
  return selected.slice(0, 3)
}

/**
 * Remove existing plain showcase
 */
function removeExistingShowcase(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Find showcase heading
  let showcaseIndex = -1
  for (let i = newContent.root.children.length - 1; i >= 0; i--) {
    const node = newContent.root.children[i]
    if (node.type === 'heading' && 
        node.children?.[0]?.text?.includes('おすすめゴルフ用品')) {
      showcaseIndex = i
      break
    }
  }
  
  // Remove everything from showcase heading onwards
  if (showcaseIndex >= 0) {
    // Check for divider and empty paragraph before
    let removeFrom = showcaseIndex
    if (showcaseIndex > 1) {
      const prev1 = newContent.root.children[showcaseIndex - 1]
      const prev2 = newContent.root.children[showcaseIndex - 2]
      
      // Check for divider (---)
      if (prev1?.children?.[0]?.text === '---') {
        removeFrom = showcaseIndex - 1
        
        // Also check for empty paragraph before divider
        if (prev2?.children?.length === 1 && prev2.children[0]?.text === '') {
          removeFrom = showcaseIndex - 2
        }
      } else if (prev1?.children?.length === 1 && prev1.children[0]?.text === '') {
        removeFrom = showcaseIndex - 1
      }
    }
    
    newContent.root.children = newContent.root.children.slice(0, removeFrom)
  }
  
  return newContent
}

/**
 * Add styled product showcase cards
 */
function addStyledShowcase(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Add HTML block for styled showcase
  const showcaseHTML = `
<div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 32px 0;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
    <div style="width: 40px; height: 40px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 20px;">🛒</span>
    </div>
    <div>
      <h3 style="margin: 0; font-size: 20px; font-weight: bold;">おすすめ商品</h3>
      <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">記事内でご紹介した商品</p>
    </div>
  </div>
  
  ${products.map((product, index) => {
    const url = product.clean_url || product.affiliate_url || '#'
    const productName = product.product_name.length > 60 
      ? product.product_name.substring(0, 60) + '...' 
      : product.product_name
    
    return `
  <div style="border-top: 1px solid #e5e7eb; padding: 20px 0; position: relative;">
    <div style="position: absolute; top: 20px; right: 0; background: #ef4444; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">
      人気 #${index + 1}
    </div>
    <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; padding-right: 80px;">
      ${productName}
    </h4>
    <p style="margin: 8px 0; color: #10b981; font-size: 24px; font-weight: bold;">
      ${product.price}
    </p>
    <a href="${url}" target="_blank" rel="nofollow sponsored noopener" style="display: inline-flex; align-items: center; gap: 4px; color: #2563eb; text-decoration: none; font-weight: 500; margin-top: 8px;">
      詳細を見る →
    </a>
  </div>`
  }).join('')}
</div>`
  
  // Add as HTML block
  newContent.root.children.push({
    type: 'htmlBlock',
    version: 1,
    html: showcaseHTML
  })
  
  return newContent
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🎨 Adding Styled Product Showcase Cards')
    console.log('=' .repeat(50))
    console.log('📝 Strategy:')
    console.log('  1. Remove plain text showcase')
    console.log('  2. Add styled card showcase with badges')
    console.log('  3. Show 3 products per post')
    console.log('=' .repeat(50))
    
    // Load products
    const products = await loadProducts()
    console.log(`\n📦 Loaded ${products.length} products`)
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000,
      depth: 0
    })
    
    console.log(`📄 Processing ${posts.docs.length} posts\n`)
    
    let processed = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children?.length) {
          continue
        }
        
        // Step 1: Remove existing plain showcase
        let cleanContent = removeExistingShowcase(post.content)
        
        // Step 2: Extract text for product matching
        const textContent = extractText(cleanContent.root).join(' ')
        
        // Step 3: Find best 3 products
        const showcaseProducts = findBestProducts(textContent, products)
        
        // Step 4: Add styled showcase
        const finalContent = addStyledShowcase(cleanContent, showcaseProducts)
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: finalContent
          },
          depth: 0
        })
        
        processed++
        console.log(`✅ ${post.title}: Added styled showcase`)
        
      } catch (error: any) {
        console.error(`❌ Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 COMPLETE')
    console.log('=' .repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log('\n✨ Result:')
    console.log('  • Removed plain showcases')
    console.log('  • Added styled card showcases')
    console.log('  • 3 products per post with badges')
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()