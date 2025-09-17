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
  
  // Sort by score and get top 5
  matches.sort((a, b) => b.score - a.score)
  let selected = matches.slice(0, 5).map(m => m.product)
  
  // If not enough, add some popular products
  if (selected.length < 5) {
    const remaining = products.filter(p => !selected.some(s => s.id === p.id))
    selected = selected.concat(remaining.slice(0, 5 - selected.length))
  }
  
  return selected.slice(0, 5)
}

/**
 * Remove all existing showcases (both plain and HTML)
 */
function removeAllShowcases(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  const newChildren = []
  
  let skipUntilNext = false
  
  for (let i = 0; i < newContent.root.children.length; i++) {
    const node = newContent.root.children[i]
    
    // Skip HTML blocks (they show as "unknown node")
    if (node.type === 'htmlBlock') {
      continue
    }
    
    // Skip showcase headings and everything after
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
      // Otherwise keep the divider
      newChildren.push(node)
    } else {
      // Keep all other content
      newChildren.push(node)
    }
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
 * Add simple Lexical-compatible showcase
 */
function addSimpleShowcase(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
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
  
  // Add divider
  newContent.root.children.push({
    type: 'paragraph',
    version: 1,
    children: [{
      type: 'text',
      text: '---',
      format: 0,
      version: 1
    }]
  })
  
  // Add heading with emoji
  newContent.root.children.push({
    type: 'heading',
    version: 1,
    tag: 'h3',
    children: [{
      type: 'text',
      text: '🛒 おすすめゴルフ用品',
      format: 1,
      version: 1
    }]
  })
  
  // Add subtitle
  newContent.root.children.push({
    type: 'paragraph',
    version: 1,
    children: [{
      type: 'text',
      text: '記事内でご紹介した商品',
      format: 2,
      version: 1
    }]
  })
  
  // Add products
  products.forEach((product, index) => {
    const url = product.clean_url || product.affiliate_url || '#'
    const productName = product.product_name.length > 70 
      ? product.product_name.substring(0, 70) + '...' 
      : product.product_name
    
    // Add product number and name
    newContent.root.children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: `【${index + 1}】 `,
          format: 1,
          version: 1
        },
        {
          type: 'link',
          version: 1,
          fields: {
            url: url,
            newTab: true,
            rel: 'nofollow sponsored noopener'
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
    
    // Add price
    if (product.price) {
      newContent.root.children.push({
        type: 'paragraph',
        version: 1,
        children: [{
          type: 'text',
          text: `💰 価格: ${product.price}`,
          format: 0,
          version: 1
        }]
      })
    }
  })
  
  return newContent
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🔧 Fixing Showcase with Lexical-Compatible Format')
    console.log('=' .repeat(50))
    console.log('📝 Strategy:')
    console.log('  1. Remove all existing showcases (HTML and plain)')
    console.log('  2. Add Lexical-compatible showcase')
    console.log('  3. Use emojis and formatting for visual appeal')
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
        
        // Step 1: Remove ALL existing showcases
        let cleanContent = removeAllShowcases(post.content)
        
        // Step 2: Extract text for product matching
        const textContent = extractText(cleanContent.root).join(' ')
        
        // Step 3: Find best 5 products
        const showcaseProducts = findBestProducts(textContent, products)
        
        // Step 4: Add simple Lexical showcase
        const finalContent = addSimpleShowcase(cleanContent, showcaseProducts)
        
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
        console.log(`✅ Fixed: ${post.title}`)
        
      } catch (error: any) {
        console.error(`❌ Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 COMPLETE')
    console.log('=' .repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log('\n✨ Result:')
    console.log('  • Removed "unknown node" HTML blocks')
    console.log('  • Added Lexical-compatible showcases')
    console.log('  • 5 products per post with clickable links')
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()