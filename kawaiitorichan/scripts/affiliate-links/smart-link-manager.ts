import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Smart Link Manager
 * Ensures affiliate links and internal links don't conflict
 * Rules:
 * 1. Internal links take priority for content flow
 * 2. Affiliate links are added only where no internal links exist
 * 3. Product showcases are placed at the end, separated from internal links
 */

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface Product {
  id: number
  product_name: string
  keyword_research: string
  keywords: string[]
  affiliate_url: string
  clean_url: string
  price: string
}

async function loadProducts(): Promise<Product[]> {
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  return products
}

/**
 * Extract all existing links from content
 */
function extractExistingLinks(node: any, links: Set<string> = new Set()): Set<string> {
  if (!node) return links
  
  // Check if this is a link node
  if (node.type === 'link') {
    // Check if it's an internal link
    if (node.fields?.doc?.relationTo === 'posts') {
      links.add('internal')
    }
    // Check if it's an affiliate link
    if (node.fields?.rel?.includes('sponsored')) {
      links.add('affiliate')
    }
    // Extract link text
    if (node.children?.[0]?.text) {
      links.add(node.children[0].text.toLowerCase())
    }
  }
  
  // Recursively check children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractExistingLinks(child, links)
    }
  }
  
  return links
}

/**
 * Check if content already has affiliate product showcase
 */
function hasProductShowcase(content: any): boolean {
  if (!content?.root?.children) return false
  
  // Check last few nodes for showcase heading
  const lastNodes = content.root.children.slice(-10)
  return lastNodes.some((node: any) => 
    node.type === 'heading' && 
    node.children?.[0]?.text?.includes('おすすめ')
  )
}

/**
 * Remove existing product showcase
 */
function removeProductShowcase(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Find index of showcase heading
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
  if (showcaseIndex > 0) {
    newContent.root.children = newContent.root.children.slice(0, showcaseIndex)
  }
  
  return newContent
}

/**
 * Add product showcase with smart placement
 */
function addSmartProductShowcase(content: any, products: Product[]): any {
  if (!content?.root?.children || products.length === 0) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Add separator paragraph
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
  
  // Add introductory text
  newContent.root.children.push({
    type: 'paragraph',
    version: 1,
    children: [{
      type: 'text',
      text: 'この記事の内容に関連する商品をご紹介します：',
      format: 0,
      version: 1
    }]
  })
  
  // Add products
  for (const product of products) {
    const url = product.clean_url || product.affiliate_url
    const productName = product.product_name.length > 60 
      ? product.product_name.substring(0, 60) + '...' 
      : product.product_name
    
    // Product link
    newContent.root.children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: '• ',
          format: 0,
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
        },
        {
          type: 'text',
          text: ` - ${product.price}`,
          format: 0,
          version: 1
        }
      ]
    })
  }
  
  return newContent
}

/**
 * Find products that don't conflict with internal links
 */
function findNonConflictingProducts(
  content: string, 
  products: Product[], 
  existingLinkTexts: Set<string>,
  limit: number = 3
): Product[] {
  const contentLower = content.toLowerCase()
  const matches: { product: Product; score: number }[] = []
  
  for (const product of products) {
    // Skip if product keywords conflict with existing links
    const hasConflict = product.keywords.some(k => 
      existingLinkTexts.has(k.toLowerCase())
    )
    if (hasConflict) continue
    
    let score = 0
    
    // Check for keyword matches
    if (product.keyword_research && contentLower.includes(product.keyword_research.toLowerCase())) {
      score += 5
    }
    
    // Check secondary keywords
    for (const keyword of product.keywords || []) {
      if (keyword && keyword.length > 2 && contentLower.includes(keyword.toLowerCase())) {
        score += 2
      }
    }
    
    if (score > 0) {
      matches.push({ product, score })
    }
  }
  
  // Sort by score and return top products
  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, limit).map(m => m.product)
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🤖 Smart Link Manager - Avoiding Conflicts')
    console.log('=' .repeat(50))
    
    // Load products
    const products = await loadProducts()
    console.log(`📦 Loaded ${products.length} products`)
    
    // Get all published posts with internal links
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      depth: 2, // Need depth for internal links
      limit: 1000
    })
    
    console.log(`📝 Processing ${posts.docs.length} posts`)
    
    let processed = 0
    let skipped = 0
    let hasInternalLinks = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children?.length) {
          skipped++
          continue
        }
        
        // Extract existing links
        const existingLinks = extractExistingLinks(post.content.root)
        
        // Check if post has internal links
        if (existingLinks.has('internal')) {
          hasInternalLinks++
          console.log(`🔗 "${post.title}" has internal links`)
        }
        
        // Extract text content
        const textContent = post.content.root.children
          .map((node: any) => {
            const texts: string[] = []
            function extractText(n: any) {
              if (n.type === 'text' && n.text) texts.push(n.text)
              if (n.children) n.children.forEach(extractText)
            }
            extractText(node)
            return texts.join(' ')
          })
          .join(' ')
        
        // Find products that don't conflict with existing links
        const safeProducts = findNonConflictingProducts(
          textContent,
          products,
          existingLinks,
          3
        )
        
        if (safeProducts.length === 0) {
          console.log(`⏭️  Skipping "${post.title}" - no safe products`)
          skipped++
          continue
        }
        
        // Remove existing showcase if present
        let updatedContent = removeProductShowcase(post.content)
        
        // Add smart product showcase
        updatedContent = addSmartProductShowcase(updatedContent, safeProducts)
        
        // Update post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent
          },
          depth: 0
        })
        
        processed++
        console.log(`✅ Updated "${post.title}" with ${safeProducts.length} non-conflicting products`)
        
      } catch (error: any) {
        console.error(`❌ Error processing "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('📊 PROCESSING COMPLETE')
    console.log('=' .repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log(`🔗 Posts with internal links: ${hasInternalLinks}`)
    console.log(`⏭️  Skipped: ${skipped} posts`)
    console.log(`📈 Success rate: ${((processed / posts.docs.length) * 100).toFixed(1)}%`)
    console.log('\n💡 Affiliate links added only where they don\'t conflict with internal links')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main()