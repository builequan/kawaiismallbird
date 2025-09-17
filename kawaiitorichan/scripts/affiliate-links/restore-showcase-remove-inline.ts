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

async function restoreShowcaseRemoveInline() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🎯 Final Fix: Remove Inline, Keep Showcase with Links')
  console.log('=' .repeat(50))
  console.log('📝 This will:')
  console.log('  1. Remove ALL inline affiliate links from article')
  console.log('  2. Keep/restore showcase WITH clickable links')
  console.log('  3. Result: ONLY showcase box, no duplication')
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
      
      const content = JSON.parse(JSON.stringify(post.content))
      
      // Step 1: Remove ALL inline affiliate links from article content
      let showcaseIndex = -1
      for (let i = 0; i < content.root.children.length; i++) {
        const node = content.root.children[i]
        
        // Find where showcase starts
        if (node.type === 'heading' && 
            node.children?.[0]?.text?.includes('おすすめゴルフ用品')) {
          showcaseIndex = i
          break
        }
        
        // Remove affiliate links ONLY from article content (before showcase)
        if (node.children && Array.isArray(node.children)) {
          const newChildren = []
          
          for (const child of node.children) {
            if (child.type === 'link') {
              const url = child.fields?.url || ''
              const rel = child.fields?.rel || ''
              const isAffiliate = rel.includes('sponsored') || 
                                 url.includes('a8.net') || 
                                 url.includes('rakuten') ||
                                 url.includes('moshimo') ||
                                 url.includes('af.')
              
              if (isAffiliate) {
                // Replace with plain text
                if (child.children && child.children[0]) {
                  newChildren.push({
                    type: 'text',
                    text: child.children[0].text || '',
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
      
      // Step 2: Remove old showcase (everything from showcase heading onwards)
      if (showcaseIndex >= 0) {
        content.root.children = content.root.children.slice(0, showcaseIndex)
      }
      
      // Step 3: Get text for product matching (before showcase)
      const textContent = extractText({ root: { children: content.root.children } }).join(' ')
      
      // Step 4: Find best products
      const showcaseProducts = findBestProducts(textContent, products)
      
      // Step 5: Add NEW showcase with proper links
      // Add separator
      content.root.children.push({
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
      content.root.children.push({
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
      content.root.children.push({
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
      
      // Add products with CLICKABLE links
      for (const product of showcaseProducts) {
        const url = product.clean_url || product.affiliate_url || '#'
        const productName = product.product_name.length > 70 
          ? product.product_name.substring(0, 70) + '...' 
          : product.product_name
        
        // Product link paragraph
        content.root.children.push({
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
        
        // Price paragraph
        if (product.price) {
          content.root.children.push({
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
      
      // Update the post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: content
        },
        depth: 0
      })
      
      processed++
      console.log(`✅ Fixed: ${post.title}`)
      
    } catch (error: any) {
      console.error(`❌ Error processing "${post.title}":`, error.message)
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 COMPLETE')
  console.log('=' .repeat(50))
  console.log(`✅ Processed: ${processed} posts`)
  console.log('\n✨ Final Result:')
  console.log('  • NO inline affiliate links in article text')
  console.log('  • Showcase boxes WITH 5 clickable product links')
  console.log('  • No duplication - ONLY showcase at bottom')
}

restoreShowcaseRemoveInline().catch(console.error)