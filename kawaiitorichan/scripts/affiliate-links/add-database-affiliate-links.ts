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

function addLinksToContent(node: any, products: Product[], usedKeywords: Set<string>, linkCount: { count: number }): any {
  const maxLinks = 6
  
  if (linkCount.count >= maxLinks) return node
  if (isHeading(node)) return node
  if (hasExistingLink(node)) return node
  
  // Process paragraph nodes
  if (node.type === 'paragraph' && node.children) {
    const newChildren: any[] = []
    
    for (const child of node.children) {
      if (linkCount.count >= maxLinks) {
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
        
        // Sort products by anchor phrase length (longer first for better matching)
        const sortedProducts = [...products].sort((a, b) => {
          const aMaxLen = Math.max(...(a.anchorPhrases || []).map(p => p.length))
          const bMaxLen = Math.max(...(b.anchorPhrases || []).map(p => p.length))
          return bMaxLen - aMaxLen
        })
        
        // Try to find a match
        for (const product of sortedProducts) {
          if (linkCount.count >= maxLinks) break
          if (!product.anchorPhrases || product.anchorPhrases.length === 0) continue
          
          for (const phrase of product.anchorPhrases) {
            if (linkCount.count >= maxLinks) break
            if (!phrase || phrase.length < 2) continue // Skip empty or single char phrases
            if (usedKeywords.has(phrase.toLowerCase())) continue
            
            const index = text.toLowerCase().indexOf(phrase.toLowerCase())
            if (index !== -1) {
              // Found a match!
              foundMatch = true
              
              // Text before keyword
              if (index > 0) {
                segments.push({
                  type: 'text',
                  text: text.substring(0, index),
                  format: child.format || 0
                })
              }
              
              // Create affiliate link using actual product URL
              const affiliateUrl = product.affiliate_url || product.clean_url
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
                    text: '🛒 ' + text.substring(index, index + phrase.length),
                    format: 0
                  }
                ],
                format: '',
                indent: 0,
                version: 2
              })
              
              // Text after keyword
              const remainingText = text.substring(index + phrase.length)
              if (remainingText) {
                segments.push({
                  type: 'text',
                  text: remainingText,
                  format: child.format || 0
                })
              }
              
              usedKeywords.add(phrase.toLowerCase())
              linkCount.count++
              console.log(`      Linked "${phrase}" → ${product.product_name.substring(0, 50)}...`)
              break
            }
          }
          
          if (foundMatch) break
        }
        
        if (foundMatch && segments.length > 0) {
          newChildren.push(...segments)
        } else {
          newChildren.push(child)
        }
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
      children: node.children.map((child: any) => 
        addLinksToContent(child, products, usedKeywords, linkCount)
      )
    }
  }
  
  return node
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🛍️  Adding Affiliate Links from Database Products')
  console.log('==================================================')
  
  // Load products
  const products = loadProducts()
  console.log(`📦 Loaded ${products.length} active products from database`)
  
  // Show sample products
  console.log('\n📋 Sample products with affiliate URLs:')
  products.slice(0, 5).forEach(p => {
    console.log(`   • ${p.product_name.substring(0, 60)}...`)
    console.log(`     Keywords: ${(p.anchorPhrases || []).slice(0, 3).join(', ')}`)
    console.log(`     URL: ${p.affiliate_url?.substring(0, 50)}...`)
  })
  
  // First, remove all existing affiliate links with shopping cart icons
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
      // Remove shopping cart icons and their links
      const cleanContent = JSON.parse(contentStr.replace(/🛒\s*/g, ''))
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: { content: cleanContent }
      })
      console.log(`   Cleaned: ${post.title}`)
    }
  }
  
  // Now add new links
  console.log('\n📄 Adding affiliate links to posts...')
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
    
    const usedKeywords = new Set<string>()
    const linkCount = { count: 0 }
    
    const updatedRoot = addLinksToContent(post.content.root, products, usedKeywords, linkCount)
    
    if (linkCount.count > 0) {
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
      
      console.log(`   ✅ Added ${linkCount.count} affiliate links`)
      processedCount++
      totalLinksAdded += linkCount.count
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
  console.log('💡 Links now use actual product URLs from database:')
  console.log('   - Each keyword linked to specific product')
  console.log('   - Blue color with shopping cart icon (🛒)')
  console.log('   - Opens in new tab')
  console.log('   - Maximum 6 links per post')
  
  await payload.db.destroy()
}

main().catch(console.error)