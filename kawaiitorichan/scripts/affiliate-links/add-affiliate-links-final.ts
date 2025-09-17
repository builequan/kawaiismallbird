import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs'
import * as path from 'path'

interface Product {
  id: number
  product_name: string
  anchorPhrases: string[]
  affiliate_url: string
  price: string
  status: string
}

interface LinkMatch {
  phrase: string
  product: Product
}

// Load products from JSON
function loadProducts(): Product[] {
  const filePath = path.join(process.cwd(), 'data/affiliate-links/products-index.json')
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data).filter((p: Product) => p.status === 'active')
}

// Check if node is heading
function isHeading(node: any): boolean {
  return node.type === 'heading' && node.tag && [1, 2, 3].includes(Number(node.tag))
}

// Check if node already has a link
function hasLink(node: any): boolean {
  if (node.type === 'link' || node.type === 'autolink') return true
  if (node.children && Array.isArray(node.children)) {
    return node.children.some((child: any) => hasLink(child))
  }
  return false
}

// Find best matching products for text
function findBestMatches(text: string, products: Product[], maxMatches: number = 6): LinkMatch[] {
  const matches: LinkMatch[] = []
  const usedPhrases = new Set<string>()
  const lowerText = text.toLowerCase()
  
  // Sort products by relevance (longer phrases first, more specific)
  const sortedProducts = [...products].sort((a, b) => {
    const aMaxLen = Math.max(...a.anchorPhrases.map(p => p.length))
    const bMaxLen = Math.max(...b.anchorPhrases.map(p => p.length))
    return bMaxLen - aMaxLen
  })
  
  for (const product of sortedProducts) {
    if (matches.length >= maxMatches) break
    
    for (const phrase of product.anchorPhrases) {
      if (matches.length >= maxMatches) break
      if (usedPhrases.has(phrase.toLowerCase())) continue
      
      // Check if phrase exists in text
      if (lowerText.includes(phrase.toLowerCase())) {
        matches.push({ phrase, product })
        usedPhrases.add(phrase.toLowerCase())
        break // Only one phrase per product
      }
    }
  }
  
  return matches
}

// Add links to content
function addAffiliateLinks(content: any, products: Product[]): { content: any, linksAdded: number } {
  let linksAdded = 0
  const maxLinks = 6
  const usedPhrases = new Set<string>()
  
  function processNode(node: any): any {
    if (linksAdded >= maxLinks) return node
    
    // Skip headings
    if (isHeading(node)) return node
    
    // Skip nodes that already have links
    if (hasLink(node)) return node
    
    // Process text nodes in paragraphs
    if (node.type === 'paragraph' && node.children) {
      const newChildren: any[] = []
      
      for (const child of node.children) {
        if (linksAdded >= maxLinks) {
          newChildren.push(child)
          continue
        }
        
        if (child.type === 'text' && child.text) {
          const text = child.text
          const matches = findBestMatches(text, products, maxLinks - linksAdded)
          
          if (matches.length === 0) {
            newChildren.push(child)
            continue
          }
          
          // Process text and add links
          let lastPos = 0
          const segments: any[] = []
          
          for (const match of matches) {
            if (usedPhrases.has(match.phrase.toLowerCase())) continue
            
            const lowerText = text.toLowerCase()
            const lowerPhrase = match.phrase.toLowerCase()
            const index = lowerText.indexOf(lowerPhrase, lastPos)
            
            if (index === -1) continue
            
            // Add text before match
            if (index > lastPos) {
              segments.push({
                type: 'text',
                text: text.substring(lastPos, index),
                format: child.format || 0
              })
            }
            
            // Add affiliate link with shopping cart
            segments.push({
              type: 'link',
              fields: {
                url: match.product.affiliate_url,
                newTab: true,
                linkType: 'custom',
                rel: 'sponsored nofollow noopener'
              },
              children: [
                {
                  type: 'text',
                  text: '🛒 ' + text.substring(index, index + match.phrase.length),
                  format: 0
                }
              ],
              format: '',
              indent: 0,
              version: 2
            })
            
            usedPhrases.add(match.phrase.toLowerCase())
            linksAdded++
            lastPos = index + match.phrase.length
            
            if (linksAdded >= maxLinks) break
          }
          
          // Add remaining text
          if (lastPos < text.length) {
            segments.push({
              type: 'text',
              text: text.substring(lastPos),
              format: child.format || 0
            })
          }
          
          newChildren.push(...segments)
        } else {
          newChildren.push(child)
        }
      }
      
      return { ...node, children: newChildren }
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map((child: any) => processNode(child))
      }
    }
    
    return node
  }
  
  const processedContent = processNode(content)
  return { content: processedContent, linksAdded }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🛍️  Adding Affiliate Links with Shopping Cart Icons')
  console.log('==================================================')
  
  // Load products
  const products = loadProducts()
  console.log(`📦 Loaded ${products.length} active products`)
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0
  })
  
  console.log(`📄 Processing ${posts.docs.length} posts`)
  console.log('==================================================')
  
  let processedCount = 0
  let totalLinksAdded = 0
  
  for (const post of posts.docs) {
    if (!post.content_html?.root?.children) continue
    
    // Skip if already has shopping cart icons (affiliate links)
    const contentStr = JSON.stringify(post.content_html)
    if (contentStr.includes('🛒')) {
      console.log(`⏭️  Skipping: ${post.title} (already has affiliate links)`)
      continue
    }
    
    // Add affiliate links
    const { content: updatedRoot, linksAdded } = addAffiliateLinks(
      post.content_html.root,
      products
    )
    
    if (linksAdded > 0) {
      const updatedContent = {
        ...post.content_html,
        root: updatedRoot
      }
      
      // Update the post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content_html: updatedContent
        }
      })
      
      console.log(`✅ Added ${linksAdded} links to: ${post.title}`)
      processedCount++
      totalLinksAdded += linksAdded
    } else {
      console.log(`⏭️  No matches found: ${post.title}`)
    }
  }
  
  console.log('')
  console.log('==================================================')
  console.log('📊 COMPLETE')
  console.log('==================================================')
  console.log(`✅ Processed: ${processedCount} posts`)
  console.log(`🔗 Total links added: ${totalLinksAdded}`)
  console.log(`📌 Average links per post: ${processedCount > 0 ? (totalLinksAdded / processedCount).toFixed(1) : 0}`)
  
  await payload.db.destroy()
}

main().catch(console.error)