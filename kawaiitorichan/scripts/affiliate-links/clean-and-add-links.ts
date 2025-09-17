import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_INLINE_LINKS = 3  // Maximum inline links per post
const MAX_SHOWCASE_PRODUCTS = 3  // Products in showcase section

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
 * Check if a node contains any links (internal or affiliate)
 */
function hasAnyLinks(node: any): boolean {
  if (!node) return false
  
  if (node.type === 'link') {
    return true
  }
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      if (hasAnyLinks(child)) return true
    }
  }
  
  return false
}

/**
 * Remove all affiliate links and showcases (keep internal links)
 */
function removeAffiliateContent(content: any): any {
  if (!content?.root?.children) return content
  
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Remove showcase section
  let showcaseIndex = -1
  for (let i = newContent.root.children.length - 1; i >= 0; i--) {
    const node = newContent.root.children[i]
    if (node.type === 'heading' && 
        node.children?.[0]?.text?.includes('JYY')) {
      showcaseIndex = i
      break
    }
  }
  
  if (showcaseIndex >= 0) {
    newContent.root.children = newContent.root.children.slice(0, showcaseIndex)
  }
  
  // Remove affiliate links from content (keep internal links)
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
 * Find best keywords to link (avoiding existing links)
 */
function findBestKeywords(content: any, products: Product[], maxLinks: number): Map<string, Product> {
  const keywordMap = new Map<string, Product>()
  
  // Common golf keywords to look for
  const priorityKeywords = [
    '´ëÕ¯éÖ', 'Éé¤Ðü', '¢¤¢ó', 'Ñ¿ü', '¦§Ã¸',
    '´ëÕÜüë', '´ëÕ·åüº', '°íüÖ', '´ëÕ¦§¢',
    '´ëÕÐÃ°', 'Æ£ü', 'Þü«ü', 'ôÒhw', '¹¤ó°'
  ]
  
  // Find products matching priority keywords
  for (const keyword of priorityKeywords) {
    if (keywordMap.size >= maxLinks) break
    
    const matchingProduct = products.find(p => {
      const allKeywords = [
        p.keyword_research,
        ...(p.keywords || []),
        ...(p.anchorPhrases || []).slice(0, 3)
      ].filter(k => k)
      
      return allKeywords.some(k => 
        k.includes(keyword) || keyword.includes(k)
      )
    })
    
    if (matchingProduct && !Array.from(keywordMap.values()).includes(matchingProduct)) {
      keywordMap.set(keyword, matchingProduct)
    }
  }
  
  return keywordMap
}

/**
 * Add inline links to content
 */
function addInlineLinks(content: any, keywordMap: Map<string, Product>): { content: any; linksAdded: number } {
  if (!content?.root?.children || keywordMap.size === 0) return { content, linksAdded: 0 }
  
  const newContent = JSON.parse(JSON.stringify(content))
  const usedKeywords = new Set<string>()
  let linksAdded = 0
  
  // Process paragraphs
  for (const node of newContent.root.children) {
    if (!['paragraph', 'heading'].includes(node.type)) continue
    if (hasAnyLinks(node)) continue  // Skip nodes with existing links
    if (!node.children) continue
    
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      
      if (child.type !== 'text' || !child.text) continue
      
      const text = child.text
      let found = false
      
      // Try to find a keyword to link
      for (const [keyword, product] of keywordMap) {
        if (usedKeywords.has(keyword)) continue
        
        const index = text.indexOf(keyword)
        if (index !== -1) {
          found = true
          usedKeywords.add(keyword)
          linksAdded++
          
          const before = text.substring(0, index)
          const linkText = text.substring(index, index + keyword.length)
          const after = text.substring(index + keyword.length)
          
          const url = product.clean_url || product.affiliate_url || '#'
          
          const newNodes = []
          
          if (before) {
            newNodes.push({
              type: 'text',
              text: before,
              format: child.format || 0,
              version: 1
            })
          }
          
          newNodes.push({
            type: 'link',
            version: 1,
            fields: {
              url: url,
              newTab: true,
              rel: 'nofollow sponsored noopener'
            },
            children: [{
              type: 'text',
              text: linkText,
              format: 0,
              version: 1
            }]
          })
          
          if (after) {
            newNodes.push({
              type: 'text',
              text: after,
              format: child.format || 0,
              version: 1
            })
          }
          
          node.children.splice(i, 1, ...newNodes)
          i += newNodes.length - 1
          break
        }
      }
      
      if (found) break  // One link per paragraph
    }
  }
  
  return { content: newContent, linksAdded }
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
  
  // Add heading
  newContent.root.children.push({
    type: 'heading',
    version: 1,
    tag: 'h3',
    children: [{
      type: 'text',
      text: 'JYY´ëÕ(Á',
      format: 0,
      version: 1
    }]
  })
  
  // Add products
  for (const product of products.slice(0, MAX_SHOWCASE_PRODUCTS)) {
    const url = product.clean_url || product.affiliate_url || '#'
    const productName = product.product_name.length > 60 
      ? product.product_name.substring(0, 60) + '...' 
      : product.product_name
    
    newContent.root.children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: '¶ ',
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
    
    if (product.price) {
      newContent.root.children.push({
        type: 'paragraph',
        version: 1,
        children: [{
          type: 'text',
          text: `¡<: ${product.price}`,
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
    
    console.log('>ù Cleaning and Adding Affiliate Links')
    console.log('=' .repeat(50))
    console.log('=Ý Strategy:')
    console.log('  1. Remove existing affiliate content')
    console.log('  2. Add inline links to keywords (avoiding conflicts)')
    console.log('  3. Add product showcase at the end')
    console.log('=' .repeat(50))
    
    // Load products
    const products = await loadProducts()
    console.log(`\n=æ Loaded ${products.length} products`)
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000,
      depth: 2  // Need depth to check for internal links
    })
    
    console.log(`=Ä Processing ${posts.docs.length} posts\n`)
    
    let processed = 0
    let totalInlineLinks = 0
    let totalShowcases = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children?.length) {
          console.log(`í  Skipping "${post.title}" - no content`)
          continue
        }
        
        // Step 1: Remove existing affiliate content
        let cleanContent = removeAffiliateContent(post.content)
        
        // Step 2: Find best keywords to link
        const keywordMap = findBestKeywords(cleanContent, products, MAX_INLINE_LINKS)
        
        // Step 3: Add inline links
        const { content: linkedContent, linksAdded } = addInlineLinks(cleanContent, keywordMap)
        
        // Step 4: Find products for showcase
        const showcaseProducts = products.slice(0, MAX_SHOWCASE_PRODUCTS)
        
        // Step 5: Add showcase
        const finalContent = addProductShowcase(linkedContent, showcaseProducts)
        
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
        totalInlineLinks += linksAdded
        if (showcaseProducts.length > 0) totalShowcases++
        
        console.log(` "${post.title}": ${linksAdded} inline + showcase`)
        
      } catch (error: any) {
        console.error(`L Error with "${post.title}":`, error.message)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('=Ê COMPLETE')
    console.log('=' .repeat(50))
    console.log(` Processed: ${processed} posts`)
    console.log(`= Total inline links: ${totalInlineLinks}`)
    console.log(`=æ Posts with showcases: ${totalShowcases}`)
    console.log(`=È Avg inline links per post: ${(totalInlineLinks / processed).toFixed(1)}`)
    console.log('\n=¡ Links added to natural keywords, avoiding conflicts with internal links')
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main()