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

// Check if URL is an affiliate link
function isAffiliateUrl(url: string): boolean {
  if (!url) return false
  return url.includes('a8.net') || 
         url.includes('rakuten.co.jp') || 
         url.includes('amazon') ||
         url.includes('affiliate') ||
         url.includes('click.linksynergy')
}

// Fix shopping cart icon in link text
function ensureShoppingCart(text: string): string {
  // Remove any existing shopping cart to avoid duplicates
  const cleanText = text.replace(/🛒\s*/g, '')
  // Add shopping cart at the beginning
  return '🛒 ' + cleanText
}

// Process content to fix all affiliate links
function fixAllAffiliateLinks(node: any): { content: any, fixed: number } {
  let fixedCount = 0
  
  function processNode(n: any): any {
    // If it's a link node
    if (n.type === 'link' && n.fields) {
      const url = n.fields.url || ''
      
      // Check if it's an affiliate link
      if (isAffiliateUrl(url)) {
        // Ensure it has proper attributes
        n.fields.newTab = true
        n.fields.linkType = 'custom'
        n.fields.rel = 'sponsored nofollow noopener'
        
        // Fix children to have shopping cart icon
        if (n.children && Array.isArray(n.children)) {
          n.children = n.children.map((child: any) => {
            if (child.type === 'text' && child.text) {
              const hasCart = child.text.includes('🛒')
              if (!hasCart) {
                fixedCount++
                return {
                  ...child,
                  text: ensureShoppingCart(child.text)
                }
              }
            }
            return child
          })
        }
      }
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
  return { content: processedContent, fixed: fixedCount }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔧 Fixing All Affiliate Links')
  console.log('==================================================')
  console.log('📋 Tasks:')
  console.log('   • Add shopping cart icons to all affiliate links')
  console.log('   • Ensure proper attributes (newTab, rel tags)')
  console.log('   • Make all affiliate links consistent')
  console.log('')
  
  const posts = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0
  })
  
  console.log(`📄 Checking ${posts.docs.length} posts...`)
  console.log('==================================================')
  
  let totalFixed = 0
  let postsFixed = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children) continue
    
    const { content: fixedRoot, fixed } = fixAllAffiliateLinks(post.content.root)
    
    if (fixed > 0) {
      // Update post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: {
            ...post.content,
            root: fixedRoot
          }
        }
      })
      
      console.log(`✅ Fixed ${fixed} links in: ${post.title}`)
      totalFixed += fixed
      postsFixed++
    }
  }
  
  console.log('')
  console.log('==================================================')
  console.log('📊 COMPLETE')
  console.log('==================================================')
  console.log(`✅ Fixed: ${totalFixed} affiliate links`)
  console.log(`📝 Posts updated: ${postsFixed}`)
  console.log('')
  console.log('✨ All affiliate links now have:')
  console.log('   • Shopping cart icons (🛒)')
  console.log('   • Proper attributes')
  console.log('   • Consistent styling')
  
  await payload.db.destroy()
}

main().catch(console.error)