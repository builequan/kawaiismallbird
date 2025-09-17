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

function removeExistingShowcase(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Find and remove showcase section
  let showcaseIndex = -1
  for (let i = newContent.root.children.length - 1; i >= 0; i--) {
    const node = newContent.root.children[i]
    if (node.type === 'heading' && 
        node.children?.[0]?.text?.includes('おすすめ')) {
      showcaseIndex = i
      break
    }
  }
  
  if (showcaseIndex > 0) {
    // Remove everything from showcase heading onwards
    newContent.root.children = newContent.root.children.slice(0, showcaseIndex)
    // Also remove empty paragraph before if exists
    if (showcaseIndex > 0) {
      const prevNode = newContent.root.children[showcaseIndex - 1]
      if (prevNode?.type === 'paragraph' && 
          prevNode.children?.[0]?.text === '') {
        newContent.root.children = newContent.root.children.slice(0, showcaseIndex - 1)
      }
    }
  }
  
  return newContent
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

function findBestProducts(content: string, products: Product[]): Product[] {
  const contentLower = content.toLowerCase()
  const matches: { product: Product; score: number }[] = []
  
  for (const product of products) {
    let score = 0
    
    // Basic keyword matching
    const allKeywords = [
      product.keyword_research,
      ...(product.keywords || []),
      ...(product.anchorPhrases || []).slice(0, 3)
    ].filter(k => k && k.length > 2)
    
    for (const keyword of allKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 5
      }
    }
    
    // Boost for common terms
    const golfTerms = ['ゴルフ', 'ドライバー', 'アイアン', 'パター', 'ボール', 'クラブ', 'ウェア']
    for (const term of golfTerms) {
      if (product.product_name.includes(term) && contentLower.includes(term.toLowerCase())) {
        score += 3
      }
    }
    
    if (score > 0) {
      matches.push({ product, score })
    }
  }
  
  // Sort by score
  matches.sort((a, b) => b.score - a.score)
  
  // Get top 3
  let selected = matches.slice(0, 3).map(m => m.product)
  
  // If not enough, add popular products
  if (selected.length < 3) {
    const popularProducts = products.filter(p => 
      !selected.some(s => s.id === p.id) &&
      (p.product_name.includes('ボール') || p.product_name.includes('クラブ'))
    ).slice(0, 3 - selected.length)
    
    selected = selected.concat(popularProducts)
  }
  
  // If still not enough, just take any products
  if (selected.length < 3) {
    const remaining = products.filter(p => 
      !selected.some(s => s.id === p.id)
    ).slice(0, 3 - selected.length)
    
    selected = selected.concat(remaining)
  }
  
  return selected.slice(0, 3)
}

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
    
    // Price
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
    
    console.log('🔄 Resetting and adding affiliate product showcases...')
    
    // Load products
    const products = await loadProducts()
    console.log(`📦 Loaded ${products.length} products`)
    
    if (products.length === 0) {
      console.error('❌ No products found!')
      return
    }
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000,
      depth: 0
    })
    
    console.log(`📝 Processing ${posts.docs.length} posts`)
    
    let processed = 0
    let errors = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children?.length) {
          console.log(`⏭️  Skipping "${post.title}" - no content`)
          continue
        }
        
        // Remove existing showcase if present
        let updatedContent = removeExistingShowcase(post.content)
        
        // Extract text for matching
        const textContent = extractText(updatedContent.root).join(' ')
        
        // Find best products
        const matchedProducts = findBestProducts(textContent, products)
        
        if (matchedProducts.length === 0) {
          console.log(`⚠️  No products for "${post.title}"`)
          continue
        }
        
        // Add new showcase
        updatedContent = addProductShowcase(updatedContent, matchedProducts)
        
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
        console.log(`✅ Updated "${post.title}" with ${matchedProducts.length} products`)
        
      } catch (error: any) {
        errors++
        console.error(`❌ Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Processed: ${processed} posts`)
    console.log(`❌ Errors: ${errors}`)
    console.log(`📈 Success rate: ${((processed / posts.docs.length) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('Fatal error:', error)
  }
}

main()