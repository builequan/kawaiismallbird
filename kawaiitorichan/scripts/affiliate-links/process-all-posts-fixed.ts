import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_LINKS_PER_POST = 6
const MIN_TEXT_LENGTH = 200

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
  
  for (const product of products) {
    let score = 0
    
    // Check primary keyword
    if (product.keyword_research && contentLower.includes(product.keyword_research.toLowerCase())) {
      score += 10
    }
    
    // Check secondary keywords
    for (const keyword of product.keywords || []) {
      if (keyword && contentLower.includes(keyword.toLowerCase())) {
        score += 5
      }
    }
    
    // Check anchor phrases
    for (const phrase of product.anchorPhrases || []) {
      if (phrase && phrase.length > 2 && contentLower.includes(phrase.toLowerCase())) {
        score += 3
      }
    }
    
    // Check for product type matches
    const productTypes = ['ドライバー', 'アイアン', 'パター', 'ウェッジ', 'ボール', 'グローブ', 'シューズ', 'ウェア', 'バッグ']
    for (const type of productTypes) {
      if (product.product_name.includes(type) && contentLower.includes(type.toLowerCase())) {
        score += 2
      }
    }
    
    if (score > 0) {
      matches.push({ product, score })
    }
  }
  
  // Sort by score and return top products
  matches.sort((a, b) => b.score - a.score)
  const selected = matches.slice(0, limit).map(m => m.product)
  
  // If we don't have enough matches, add some random popular products
  if (selected.length < 3) {
    const popularKeywords = ['ゴルフボール', 'ゴルフクラブ', 'ゴルフウェア']
    for (const keyword of popularKeywords) {
      if (selected.length >= 3) break
      const found = products.find(p => 
        p.product_name.includes(keyword) && 
        !selected.some(s => s.id === p.id)
      )
      if (found) selected.push(found)
    }
  }
  
  return selected
}

function addInlineLinks(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  let linksAdded = 0
  const maxInlineLinks = 3
  const usedProducts = new Set<number>()
  
  // Process paragraphs for inline links
  for (let i = 0; i < newContent.root.children.length && linksAdded < maxInlineLinks; i++) {
    const node = newContent.root.children[i]
    if (node.type !== 'paragraph' || !node.children) continue
    
    for (let j = 0; j < node.children.length && linksAdded < maxInlineLinks; j++) {
      const child = node.children[j]
      if (child.type !== 'text' || !child.text) continue
      
      const text = child.text
      const textLower = text.toLowerCase()
      
      // Try to find a matching product
      for (const product of products) {
        if (usedProducts.has(product.id)) continue
        if (linksAdded >= maxInlineLinks) break
        
        // Try to find a keyword match
        const keywords = [
          product.keyword_research,
          ...product.keywords.slice(0, 2)
        ].filter(k => k && k.length > 2)
        
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase()
          const index = textLower.indexOf(keywordLower)
          
          if (index !== -1) {
            // Found a match! Split the text and insert link
            const before = text.substring(0, index)
            const linkText = text.substring(index, index + keyword.length)
            const after = text.substring(index + keyword.length)
            
            const newChildren = []
            
            if (before) {
              newChildren.push({
                type: 'text',
                text: before,
                format: child.format || 0,
                version: 1
              })
            }
            
            newChildren.push({
              type: 'link',
              version: 1,
              fields: {
                url: product.clean_url || product.affiliate_url,
                newTab: true,
                rel: 'nofollow sponsored'
              },
              children: [{
                type: 'text',
                text: linkText,
                format: 0,
                version: 1
              }]
            })
            
            if (after) {
              newChildren.push({
                type: 'text',
                text: after,
                format: child.format || 0,
                version: 1
              })
            }
            
            // Replace the text node with new nodes
            node.children.splice(j, 1, ...newChildren)
            j += newChildren.length - 1
            
            linksAdded++
            usedProducts.add(product.id)
            break
          }
        }
      }
    }
  }
  
  return newContent
}

function addProductShowcase(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
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
  
  // Add product recommendations
  for (const product of products) {
    const url = product.clean_url || product.affiliate_url
    
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
            rel: 'nofollow sponsored'
          },
          children: [{
            type: 'text',
            text: product.product_name.length > 50 
              ? product.product_name.substring(0, 50) + '...' 
              : product.product_name,
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
  
  return content
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🚀 Starting affiliate links processing...')
    
    // Load products
    const products = await loadProducts()
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000
    })
    
    console.log(`📝 Found ${posts.docs.length} published posts`)
    
    let processed = 0
    let skipped = 0
    let totalLinksAdded = 0
    
    for (const post of posts.docs) {
      try {
        // Skip if no content
        if (!post.content?.root?.children?.length) {
          console.log(`⏭️  Skipping "${post.title}" - no content`)
          skipped++
          continue
        }
        
        // Extract text content
        const textContent = extractText(post.content.root).join(' ')
        
        // Skip if content is too short
        if (textContent.length < MIN_TEXT_LENGTH) {
          console.log(`⏭️  Skipping "${post.title}" - content too short (${textContent.length} chars)`)
          skipped++
          continue
        }
        
        // Find best matching products
        const matchedProducts = findBestProducts(textContent, products, 6)
        
        if (matchedProducts.length === 0) {
          console.log(`⏭️  Skipping "${post.title}" - no matching products`)
          skipped++
          continue
        }
        
        console.log(`🔗 Processing "${post.title}" with ${matchedProducts.length} products`)
        
        // Add inline links (up to 3)
        let updatedContent = addInlineLinks(post.content, matchedProducts.slice(0, 3))
        
        // Add product showcase at the end (3 products)
        updatedContent = addProductShowcase(updatedContent, matchedProducts.slice(0, 3))
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent
          }
        })
        
        processed++
        totalLinksAdded += matchedProducts.length
        
        console.log(`✅ Updated "${post.title}" with ${matchedProducts.length} affiliate links`)
        
      } catch (error) {
        console.error(`❌ Error processing "${post.title}":`, error)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 PROCESSING COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log(`⏭️  Skipped: ${skipped} posts`)
    console.log(`🔗 Total links added: ${totalLinksAdded}`)
    console.log(`📈 Average links per post: ${processed > 0 ? (totalLinksAdded / processed).toFixed(1) : 0}`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()