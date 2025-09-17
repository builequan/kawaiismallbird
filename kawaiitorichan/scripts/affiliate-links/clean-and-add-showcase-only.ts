import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MIN_SHOWCASE_PRODUCTS = 3  // Minimum products in showcase
const MAX_SHOWCASE_PRODUCTS = 5  // Maximum products in showcase

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
 * Remove all affiliate links from content (keep internal links)
 */
function removeAllAffiliateLinks(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Process each node
  for (const node of newContent.root.children) {
    if (node.children && Array.isArray(node.children)) {
      const newChildren = []
      
      for (const child of node.children) {
        if (child.type === 'link') {
          // Check if it's an affiliate link
          const isAffiliate = child.fields?.rel?.includes('sponsored') || 
                             child.fields?.url?.includes('a8.net') || 
                             child.fields?.url?.includes('rakuten')
          
          if (isAffiliate) {
            // Replace affiliate link with plain text
            if (child.children && child.children[0]?.text) {
              newChildren.push({
                type: 'text',
                text: child.children[0].text,
                format: child.children[0].format || 0,
                version: 1
              })
            }
          } else {
            // Keep internal links
            newChildren.push(child)
          }
        } else {
          newChildren.push(child)
        }
      }
      
      node.children = newChildren
    }
  }
  
  return newContent
}

/**
 * Remove existing showcase section
 */
function removeExistingShowcase(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Find showcase heading
  let showcaseIndex = -1
  for (let i = newContent.root.children.length - 1; i >= 0; i--) {
    const node = newContent.root.children[i]
    if (node.type === 'heading' && 
        node.children?.[0]?.text?.includes('おすすめ')) {
      showcaseIndex = i
      break
    }
  }
  
  // Remove everything from showcase heading onwards
  if (showcaseIndex >= 0) {
    // Check for empty paragraph before
    if (showcaseIndex > 0) {
      const prevNode = newContent.root.children[showcaseIndex - 1]
      if (prevNode?.type === 'paragraph' && 
          (!prevNode.children?.length || 
           (prevNode.children.length === 1 && prevNode.children[0]?.text === ''))) {
        newContent.root.children = newContent.root.children.slice(0, showcaseIndex - 1)
      } else {
        newContent.root.children = newContent.root.children.slice(0, showcaseIndex)
      }
    } else {
      newContent.root.children = newContent.root.children.slice(0, showcaseIndex)
    }
  }
  
  return newContent
}

/**
 * Find best products for showcase based on content
 */
function findBestProducts(textContent: string, products: Product[], minCount: number, maxCount: number): Product[] {
  const matches: { product: Product; score: number }[] = []
  
  const contentLower = textContent.toLowerCase()
  
  for (const product of products) {
    let score = 0
    
    // Check primary keyword
    if (product.keyword_research && contentLower.includes(product.keyword_research.toLowerCase())) {
      score += 10
    }
    
    // Check secondary keywords
    if (product.keywords && Array.isArray(product.keywords)) {
      for (const keyword of product.keywords.slice(0, 3)) {
        if (keyword && keyword.length > 2 && contentLower.includes(keyword.toLowerCase())) {
          score += 5
        }
      }
    }
    
    // Check anchor phrases
    if (product.anchorPhrases && Array.isArray(product.anchorPhrases)) {
      for (const phrase of product.anchorPhrases.slice(0, 3)) {
        if (phrase && phrase.length > 3 && contentLower.includes(phrase.toLowerCase())) {
          score += 2
        }
      }
    }
    
    // Boost for common golf terms
    const golfTypes = ['ゴルフ', 'ドライバー', 'アイアン', 'パター', 'ウェッジ', 'ボール', 'グローブ', 'シューズ', 'クラブ', 'ウェア', 'バッグ']
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
  let selected = matches.slice(0, maxCount).map(m => m.product)
  
  // If not enough matches, add popular products
  if (selected.length < minCount) {
    const popularProducts = products.filter(p => {
      // Filter out already selected
      if (selected.some(s => s.id === p.id)) return false
      
      // Prefer popular categories
      return p.product_name.includes('ボール') || 
             p.product_name.includes('クラブ') || 
             p.product_name.includes('グローブ') ||
             p.product_name.includes('ドライバー') ||
             p.product_name.includes('アイアン')
    })
    
    // Shuffle for variety
    const shuffled = popularProducts.sort(() => Math.random() - 0.5)
    selected = selected.concat(shuffled.slice(0, minCount - selected.length))
  }
  
  // Ensure we have at least minimum products
  if (selected.length < minCount) {
    const remaining = products.filter(p => !selected.some(s => s.id === p.id))
    selected = selected.concat(remaining.slice(0, minCount - selected.length))
  }
  
  return selected.slice(0, Math.max(minCount, Math.min(selected.length, maxCount)))
}

/**
 * Add product showcase section
 */
function addProductShowcase(content: any, products: Product[]): any {
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
  
  // Add products
  for (const product of products) {
    const url = product.clean_url || product.affiliate_url || '#'
    const productName = product.product_name.length > 70 
      ? product.product_name.substring(0, 70) + '...' 
      : product.product_name
    
    // Product link
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

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🎯 Setting up Product Showcase Only')
    console.log('=' .repeat(50))
    console.log('📝 Strategy:')
    console.log('  1. Remove ALL inline affiliate links')
    console.log('  2. Remove existing showcases')
    console.log(`  3. Add new showcase with ${MIN_SHOWCASE_PRODUCTS}-${MAX_SHOWCASE_PRODUCTS} products`)
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
    let totalProducts = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children?.length) {
          console.log(`⏭️  Skipping "${post.title}" - no content`)
          continue
        }
        
        // Step 1: Remove ALL affiliate links from content
        let cleanContent = removeAllAffiliateLinks(post.content)
        
        // Step 2: Remove existing showcase
        cleanContent = removeExistingShowcase(cleanContent)
        
        // Step 3: Extract text for product matching
        const textContent = extractText(cleanContent.root).join(' ')
        
        // Step 4: Find best products for showcase
        const showcaseProducts = findBestProducts(
          textContent, 
          products, 
          MIN_SHOWCASE_PRODUCTS, 
          MAX_SHOWCASE_PRODUCTS
        )
        
        // Step 5: Add new showcase
        const finalContent = addProductShowcase(cleanContent, showcaseProducts)
        
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
        totalProducts += showcaseProducts.length
        
        console.log(`✅ "${post.title}": Added ${showcaseProducts.length} products`)
        
      } catch (error: any) {
        console.error(`❌ Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 COMPLETE')
    console.log('=' .repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log(`📦 Total products added: ${totalProducts}`)
    console.log(`📈 Average products per post: ${(totalProducts / processed).toFixed(1)}`)
    console.log('\n✨ Result:')
    console.log('  • NO inline affiliate links in article text')
    console.log(`  • Each post has ${MIN_SHOWCASE_PRODUCTS}+ products in showcase box`)
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()