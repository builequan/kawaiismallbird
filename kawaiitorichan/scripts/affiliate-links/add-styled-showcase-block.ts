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
 * Remove ALL existing showcases and plain links
 */
function removeAllAffiliateContent(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  const newChildren = []
  
  for (let i = 0; i < newContent.root.children.length; i++) {
    const node = newContent.root.children[i]
    
    // Skip any showcase-related content
    if (node.type === 'heading' && 
        node.children?.[0]?.text?.includes('おすすめ')) {
      break // Stop processing, don't include anything after showcase
    }
    
    // Skip dividers before showcase
    if (node.children?.[0]?.text === '---') {
      // Check if next node is showcase heading
      if (i + 1 < newContent.root.children.length) {
        const nextNode = newContent.root.children[i + 1]
        if (nextNode.type === 'heading' && 
            nextNode.children?.[0]?.text?.includes('おすすめ')) {
          break // This is the divider before showcase, stop here
        }
      }
    }
    
    // Keep all other content
    newChildren.push(node)
  }
  
  // Remove trailing empty paragraphs
  while (newChildren.length > 0) {
    const lastNode = newChildren[newChildren.length - 1]
    if (lastNode.type === 'paragraph' && 
        (!lastNode.children || lastNode.children.length === 0 ||
         (lastNode.children.length === 1 && lastNode.children[0]?.text === ''))) {
      newChildren.pop()
    } else {
      break
    }
  }
  
  newContent.root.children = newChildren
  return newContent
}

/**
 * Add styled affiliate showcase block
 */
function addStyledShowcaseBlock(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Create the affiliate showcase block
  const showcaseBlock = {
    type: 'block',
    version: 1,
    fields: {
      blockType: 'affiliateShowcase',
      products: products.map(product => ({
        name: product.product_name.length > 70 
          ? product.product_name.substring(0, 70) + '...' 
          : product.product_name,
        price: product.price,
        url: product.clean_url || product.affiliate_url || '#'
      }))
    }
  }
  
  // Add separator before the block
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
  
  // Add the showcase block
  newContent.root.children.push(showcaseBlock)
  
  return newContent
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🎨 Adding Styled Affiliate Showcase Block')
    console.log('=' .repeat(50))
    console.log('📝 Strategy:')
    console.log('  1. Remove ALL existing affiliate content')
    console.log('  2. Add styled showcase block component')
    console.log('  3. Show 3 products with badges and buttons')
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
        
        // Step 1: Remove ALL existing affiliate content
        let cleanContent = removeAllAffiliateContent(post.content)
        
        // Step 2: Extract text for product matching
        const textContent = extractText(cleanContent.root).join(' ')
        
        // Step 3: Find best 3 products
        const showcaseProducts = findBestProducts(textContent, products)
        
        // Step 4: Add styled showcase block
        const finalContent = addStyledShowcaseBlock(cleanContent, showcaseProducts)
        
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
        console.log(`✅ ${post.title}: Added styled showcase block`)
        
      } catch (error: any) {
        console.error(`❌ Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 COMPLETE')
    console.log('=' .repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log('\n✨ Result:')
    console.log('  • Removed ALL plain text affiliate links')
    console.log('  • Added styled showcase block component')
    console.log('  • 3 products per post with badges and "詳細を見る" buttons')
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()