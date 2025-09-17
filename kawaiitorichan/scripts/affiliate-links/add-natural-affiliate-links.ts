import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs'
import * as path from 'path'

interface Product {
  id: number
  product_name: string
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
  status: string
}

// Load products from JSON
function loadProducts(): Product[] {
  const filePath = path.join(process.cwd(), 'data/affiliate-links/products-index.json')
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data).filter((p: Product) => p.status === 'active')
}

function isHeading(node: any): boolean {
  return node.type === 'heading' && [1, 2, 3].includes(Number(node.tag))
}

function hasExistingLink(node: any): boolean {
  if (node.type === 'link' || node.type === 'autolink') return true
  return false
}

// Count paragraphs in content
function countParagraphs(node: any): number {
  let count = 0
  
  function traverse(n: any) {
    if (n.type === 'paragraph') count++
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(traverse)
    }
  }
  
  traverse(node)
  return count
}

// Process single paragraph with link limits
function processParagraph(
  paragraph: any, 
  products: Product[], 
  globalUsedKeywords: Set<string>,
  paragraphLinkLimit: number = 2, // Max 2 links per paragraph for naturalness
  globalLinkCount: { count: number },
  globalMaxLinks: number
): any {
  if (globalLinkCount.count >= globalMaxLinks) return paragraph
  
  // First check if paragraph already has links and count them
  let existingLinkCount = 0
  function countLinks(node: any) {
    if (node.type === 'link') {
      existingLinkCount++
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(countLinks)
    }
  }
  countLinks(paragraph)
  
  // If paragraph already has 2 or more links, don't add more
  if (existingLinkCount >= paragraphLinkLimit) {
    return paragraph
  }
  
  const newChildren: any[] = []
  let paragraphLinkCount = existingLinkCount // Start with existing links
  
  for (const child of paragraph.children) {
    if (paragraphLinkCount >= paragraphLinkLimit || globalLinkCount.count >= globalMaxLinks) {
      newChildren.push(child)
      continue
    }
    
    // Skip if already has link
    if (child.type === 'link' || child.type === 'autolink') {
      newChildren.push(child)
      continue
    }
    
    if (child.type === 'text' && child.text) {
      let text = child.text
      let segments: any[] = []
      let lastPos = 0
      let foundMatch = false
      
      // Sort products by anchor phrase length (longer first)
      const sortedProducts = [...products].sort((a, b) => {
        const aMaxLen = Math.max(...(a.anchorPhrases || []).map(p => p.length))
        const bMaxLen = Math.max(...(b.anchorPhrases || []).map(p => p.length))
        return bMaxLen - aMaxLen
      })
      
      // Try to find matches
      const matches: Array<{phrase: string, product: Product, index: number}> = []
      
      for (const product of sortedProducts) {
        if (!product.anchorPhrases || product.anchorPhrases.length === 0) continue
        
        for (const phrase of product.anchorPhrases) {
          if (!phrase || phrase.length < 2) continue
          if (globalUsedKeywords.has(phrase.toLowerCase())) continue
          
          const index = text.toLowerCase().indexOf(phrase.toLowerCase())
          if (index !== -1) {
            matches.push({ phrase, product, index })
          }
        }
      }
      
      // Sort matches by position
      matches.sort((a, b) => a.index - b.index)
      
      // Process only first match in this text node (max 1 link per text child)
      const maxLinksToAdd = Math.min(1, paragraphLinkLimit - paragraphLinkCount)
      for (const match of matches.slice(0, maxLinksToAdd)) {
        if (paragraphLinkCount >= paragraphLinkLimit || globalLinkCount.count >= globalMaxLinks) break
        if (globalUsedKeywords.has(match.phrase.toLowerCase())) continue
        
        foundMatch = true
        
        // Text before keyword
        if (match.index > lastPos) {
          segments.push({
            type: 'text',
            text: text.substring(lastPos, match.index),
            format: child.format || 0
          })
        }
        
        // Create affiliate link
        const affiliateUrl = match.product.affiliate_url || match.product.clean_url
        segments.push({
          type: 'link',
          fields: {
            url: affiliateUrl,
            newTab: true,
            linkType: 'custom',
            rel: 'sponsored nofollow noopener'
          },
          children: [
            {
              type: 'text',
              text: '🛒 ' + text.substring(match.index, match.index + match.phrase.length),
              format: 0
            }
          ],
          format: '',
          indent: 0,
          version: 2
        })
        
        lastPos = match.index + match.phrase.length
        globalUsedKeywords.add(match.phrase.toLowerCase())
        paragraphLinkCount++
        globalLinkCount.count++
        break // Only add one link per text node
      }
      
      // Add remaining text
      if (foundMatch) {
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
    } else {
      newChildren.push(child)
    }
  }
  
  return { ...paragraph, children: newChildren }
}

// Add links naturally throughout content
function addNaturalAffiliateLinks(node: any, products: Product[]): { content: any, linksAdded: number } {
  const globalUsedKeywords = new Set<string>()
  const globalLinkCount = { count: 0 }
  
  // Calculate distribution
  const totalParagraphs = countParagraphs(node)
  const targetLinks = Math.min(6, totalParagraphs * 2) // Max 2 per paragraph, total max 6
  
  console.log(`   📝 Article has ${totalParagraphs} paragraphs, targeting ${targetLinks} links`)
  
  function processNode(n: any): any {
    if (isHeading(n)) return n
    
    if (n.type === 'paragraph') {
      // Process paragraph with natural limits
      return processParagraph(
        n, 
        products, 
        globalUsedKeywords,
        2, // Max 2 links per paragraph
        globalLinkCount,
        targetLinks
      )
    }
    
    // Process children recursively
    if (n.children && Array.isArray(n.children)) {
      return {
        ...n,
        children: n.children.map((child: any) => processNode(child))
      }
    }
    
    return n
  }
  
  const processedContent = processNode(node)
  return { content: processedContent, linksAdded: globalLinkCount.count }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🌿 Adding Natural Affiliate Links')
  console.log('==================================================')
  console.log('📋 Strategy:')
  console.log('   • Maximum 2 links per paragraph')
  console.log('   • Maximum 6 links per article')
  console.log('   • Natural distribution throughout content')
  console.log('   • No clustering of links')
  console.log('')
  
  // Load products
  const products = loadProducts()
  console.log(`📦 Loaded ${products.length} active products from database`)
  
  // First, clean all existing affiliate links
  console.log('\n🗑️  Removing existing affiliate links...')
  const allPosts = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0
  })
  
  for (const post of allPosts.docs) {
    if (!post.content?.root) continue
    
    const contentStr = JSON.stringify(post.content)
    if (contentStr.includes('🛒')) {
      // Remove shopping cart icons
      const cleanContent = JSON.parse(contentStr.replace(/🛒\s*/g, ''))
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: { content: cleanContent }
      })
      console.log(`   Cleaned: ${post.title}`)
    }
  }
  
  // Now add natural links
  console.log('\n📄 Adding natural affiliate links...')
  console.log('==================================================')
  
  let processedCount = 0
  let totalLinksAdded = 0
  
  // Re-fetch posts after cleaning
  const posts = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0
  })
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children) {
      console.log(`⏭️  No content: ${post.title}`)
      continue
    }
    
    console.log(`\n📝 Processing: ${post.title}`)
    
    const { content: updatedRoot, linksAdded } = addNaturalAffiliateLinks(
      post.content.root,
      products
    )
    
    if (linksAdded > 0) {
      // Update post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: {
            ...post.content,
            root: updatedRoot
          }
        }
      })
      
      console.log(`   ✅ Added ${linksAdded} links naturally distributed`)
      processedCount++
      totalLinksAdded += linksAdded
    } else {
      console.log(`   ⏭️  No matching keywords found`)
    }
  }
  
  console.log('\n==================================================')
  console.log('📊 COMPLETE')
  console.log('==================================================')
  console.log(`✅ Processed: ${processedCount} posts`)
  console.log(`🔗 Total links added: ${totalLinksAdded}`)
  console.log(`📌 Average per post: ${processedCount > 0 ? (totalLinksAdded / processedCount).toFixed(1) : 0}`)
  console.log('')
  console.log('🌿 Natural Distribution Achieved:')
  console.log('   • No more than 2 links per paragraph')
  console.log('   • Links spread throughout articles')
  console.log('   • More natural reading experience')
  console.log('   • Better user engagement')
  
  await payload.db.destroy()
}

main().catch(console.error)