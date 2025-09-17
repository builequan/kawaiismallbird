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
  position: number
  length: number
}

// Load products from JSON
function loadProducts(): Product[] {
  const filePath = path.join(process.cwd(), 'data/affiliate-links/products-index.json')
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data).filter((p: Product) => p.status === 'active')
}

// Check if text is inside a heading (H1, H2, H3)
function isInHeading(node: any): boolean {
  return node.type === 'heading' && [1, 2, 3].includes(node.tag)
}

// Check if text already has a link
function hasExistingLink(node: any): boolean {
  return node.type === 'link' || node.type === 'autolink'
}

// Find keyword matches in text
function findMatches(text: string, products: Product[]): LinkMatch[] {
  const matches: LinkMatch[] = []
  const lowerText = text.toLowerCase()
  
  for (const product of products) {
    for (const phrase of product.anchorPhrases) {
      const lowerPhrase = phrase.toLowerCase()
      const index = lowerText.indexOf(lowerPhrase)
      
      if (index !== -1) {
        matches.push({
          phrase: phrase,
          product: product,
          position: index,
          length: phrase.length
        })
      }
    }
  }
  
  // Sort by position and filter overlapping matches
  matches.sort((a, b) => a.position - b.position)
  
  const filtered: LinkMatch[] = []
  let lastEnd = -1
  
  for (const match of matches) {
    if (match.position >= lastEnd) {
      filtered.push(match)
      lastEnd = match.position + match.length
    }
  }
  
  return filtered
}

// Add affiliate links to Lexical content
function addAffiliateLinks(content: any, products: Product[], maxLinks: number = 6): any {
  let linkCount = 0
  const usedPhrases = new Set<string>()
  
  function processNode(node: any): any {
    if (linkCount >= maxLinks) return node
    
    // Skip headings
    if (isInHeading(node)) return node
    
    // Skip existing links
    if (hasExistingLink(node)) return node
    
    // Process text nodes
    if (node.type === 'text' && node.text) {
      const matches = findMatches(node.text, products)
      
      if (matches.length === 0) return node
      
      // Process matches from end to beginning to maintain positions
      const nodes: any[] = []
      let lastPos = 0
      
      for (const match of matches) {
        if (linkCount >= maxLinks) break
        if (usedPhrases.has(match.phrase.toLowerCase())) continue
        
        // Add text before the match
        if (match.position > lastPos) {
          nodes.push({
            type: 'text',
            text: node.text.substring(lastPos, match.position),
            format: node.format || 0
          })
        }
        
        // Add the affiliate link with shopping cart icon
        nodes.push({
          type: 'link',
          fields: {
            url: match.product.affiliate_url,
            newTab: true,
            linkType: 'custom'
          },
          children: [
            {
              type: 'text',
              text: `🛒 ${node.text.substring(match.position, match.position + match.length)}`,
              format: 0
            }
          ],
          format: '',
          indent: 0,
          version: 2
        })
        
        usedPhrases.add(match.phrase.toLowerCase())
        linkCount++
        lastPos = match.position + match.length
      }
      
      // Add remaining text
      if (lastPos < node.text.length) {
        nodes.push({
          type: 'text',
          text: node.text.substring(lastPos),
          format: node.format || 0
        })
      }
      
      return nodes.length === 1 ? nodes[0] : nodes
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      const newChildren: any[] = []
      
      for (const child of node.children) {
        const processed = processNode(child)
        if (Array.isArray(processed)) {
          newChildren.push(...processed)
        } else {
          newChildren.push(processed)
        }
      }
      
      return { ...node, children: newChildren }
    }
    
    return node
  }
  
  return processNode(content)
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🛍️  Adding Smart Affiliate Links')
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
    
    // Count existing affiliate links
    const existingLinks = JSON.stringify(post.content_html).match(/🛒/g)?.length || 0
    
    // Skip if already has affiliate links with cart icons
    if (existingLinks > 0) {
      console.log(`⏭️  Skipping: ${post.title} (already has ${existingLinks} affiliate links)`)
      continue
    }
    
    // Add affiliate links
    const updatedContent = {
      ...post.content_html,
      root: addAffiliateLinks(post.content_html.root, products, 6)
    }
    
    // Count new links added
    const newLinks = JSON.stringify(updatedContent).match(/🛒/g)?.length || 0
    
    if (newLinks > 0) {
      // Update the post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content_html: updatedContent
        }
      })
      
      console.log(`✅ Added ${newLinks} links to: ${post.title}`)
      processedCount++
      totalLinksAdded += newLinks
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