#!/usr/bin/env tsx
/**
 * Apply affiliate links to posts with a maximum of 5 links per post
 * Both inline replacements and recommendation sections
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_LINKS_PER_POST = 5 // Maximum number of affiliate links per post

interface SimilarityResult {
  postId: string
  postSlug: string
  relevantProducts: Array<{
    productId: string
    productName: string
    score: number
    matchType: string
    matchedKeywords: string[]
  }>
}

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
}

interface LinkApplication {
  targetId: string
  productName: string
  anchorText: string
  position: string
  type: 'inline' | 'recommendation'
}

/**
 * Extract clean affiliate URL from HTML
 */
function extractAffiliateUrl(html: string): string {
  // Try to extract href from HTML
  const match = html.match(/href="([^"]+)"/i)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Create an affiliate link node for Lexical
 */
function createAffiliateLinkNode(url: string, anchorText: string): any {
  return {
    type: 'link',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: anchorText,
        version: 1,
      }
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 2,
    fields: {
      linkType: 'custom',
      url: url,
      newTab: true,
      rel: 'nofollow sponsored',
    }
  }
}

/**
 * Create a product recommendation block with limited products
 */
function createRecommendationBlock(products: Array<{ product: ProductIndex; score: number }>, maxProducts: number = 3): any {
  const recommendationNodes = []
  
  // Limit products to maxProducts
  const limitedProducts = products.slice(0, maxProducts)
  
  // Add heading
  recommendationNodes.push({
    type: 'heading',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: 'おすすめ商品',
        version: 1,
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    tag: 'h3',
    version: 1,
  })
  
  // Add products
  for (const { product } of limitedProducts) {
    // Product container
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 1, // Bold
          mode: 'normal',
          style: '',
          text: product.product_name,
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: ' - ',
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: product.price,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    // Add link
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        createAffiliateLinkNode(product.affiliate_url, `🛒 ${product.product_name}を見る`),
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
  }
  
  return recommendationNodes
}

/**
 * Apply links to a single post with a maximum limit
 */
async function applyLinksToPost(
  payload: any,
  postId: string, 
  products: Array<{ product: ProductIndex; score: number }>,
  dryRun: boolean = false
): Promise<number> {
  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })
    
    if (!post || !post.content?.root) {
      console.log(`   ⚠️  Post ${postId} has no content`)
      return 0
    }
    
    let linksAdded = 0
    const usedKeywords = new Set<string>()
    
    // Clone content for modification
    const newContent = JSON.parse(JSON.stringify(post.content))
    
    // First pass: Add inline links (maximum 2-3 to leave room for recommendations)
    const maxInlineLinks = Math.min(2, MAX_LINKS_PER_POST - 3) // Reserve space for recommendations
    
    function replaceKeywordsInNode(node: any, depth: number = 0): void {
      if (linksAdded >= maxInlineLinks) return
      if (!node || depth > 10) return
      
      // Skip if already a link
      if (node.type === 'link') return
      
      // Process text nodes
      if (node.text && typeof node.text === 'string') {
        for (const { product } of products.slice(0, 5)) { // Only check top 5 products
          if (linksAdded >= maxInlineLinks) break
          
          // Try each anchor phrase
          for (const phrase of product.anchorPhrases || []) {
            if (linksAdded >= maxInlineLinks) break
            if (usedKeywords.has(phrase.toLowerCase())) continue
            
            // Case-insensitive search
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi')
            if (regex.test(node.text)) {
              // Found a match - replace this node with link
              const linkNode = createAffiliateLinkNode(product.affiliate_url, phrase)
              Object.assign(node, linkNode)
              usedKeywords.add(phrase.toLowerCase())
              linksAdded++
              console.log(`   🔗 Added inline link for "${phrase}" → ${product.product_name}`)
              return // Move to next node
            }
          }
        }
      }
      
      // Recursively process children
      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          replaceKeywordsInNode(node.children[i], depth + 1)
        }
      }
    }
    
    // Apply inline replacements
    if (newContent.root.children) {
      for (const child of newContent.root.children) {
        if (linksAdded >= maxInlineLinks) break
        replaceKeywordsInNode(child)
      }
    }
    
    // Second pass: Add recommendation section (up to 3 products)
    const remainingLinkBudget = MAX_LINKS_PER_POST - linksAdded
    const maxRecommendations = Math.min(3, remainingLinkBudget)
    
    if (maxRecommendations > 0 && products.length > 0) {
      const recommendationNodes = createRecommendationBlock(
        products.slice(0, maxRecommendations), 
        maxRecommendations
      )
      
      // Add recommendation section at the end
      if (!newContent.root.children) {
        newContent.root.children = []
      }
      
      // Add a separator
      newContent.root.children.push({
        type: 'horizontalrule',
        version: 1,
      })
      
      // Add recommendations
      newContent.root.children.push(...recommendationNodes)
      
      linksAdded += maxRecommendations
      console.log(`   📦 Added ${maxRecommendations} product recommendations`)
    }
    
    // Update post if not dry run
    if (!dryRun && linksAdded > 0) {
      await payload.update({
        collection: 'posts',
        id: postId,
        data: {
          content: newContent,
          affiliateLinks: products.slice(0, linksAdded).map(p => ({
            productId: p.product.id,
            productName: p.product.product_name,
            anchorText: p.product.anchorPhrases?.[0] || p.product.product_name,
            url: p.product.affiliate_url,
          })),
        },
      })
    }
    
    return linksAdded
  } catch (error) {
    console.error(`   ❌ Error processing post ${postId}:`, error)
    return 0
  }
}

/**
 * Main function
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find(arg => arg.startsWith('--limit'))
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || limitArg.split(' ')[1] || '0') : 0
  
  console.log('🔗 Applying Affiliate Links to Posts (Limited to 5 per post)')
  console.log('=' .repeat(60))
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved')
  }
  
  if (limit > 0) {
    console.log(`📊 Processing limit: ${limit} posts`)
  }
  
  console.log(`🔢 Maximum links per post: ${MAX_LINKS_PER_POST}`)
  console.log('')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Load similarity results
    const similarityPath = path.join(DATA_DIR, 'similarity-results.json')
    const similarityData = await fs.readFile(similarityPath, 'utf-8')
    const similarities: SimilarityResult[] = JSON.parse(similarityData)
    
    // Load product index
    const indexPath = path.join(DATA_DIR, 'product-index.json')
    const indexData = await fs.readFile(indexPath, 'utf-8')
    const productIndex: ProductIndex[] = JSON.parse(indexData)
    
    // Create product lookup
    const productLookup = new Map<string, ProductIndex>()
    for (const product of productIndex) {
      productLookup.set(product.id, product)
    }
    
    // Process posts
    let processed = 0
    let skipped = 0
    let totalLinksAdded = 0
    
    const postsToProcess = limit > 0 ? similarities.slice(0, limit) : similarities
    
    for (const similarity of postsToProcess) {
      if (similarity.relevantProducts.length === 0) {
        console.log(`📝 ${similarity.postSlug}: No matching products`)
        skipped++
        continue
      }
      
      console.log(`📝 Processing: ${similarity.postSlug}`)
      console.log(`   Found ${similarity.relevantProducts.length} matching products`)
      
      // Get full product data
      const productsWithScores = similarity.relevantProducts
        .map(rp => ({
          product: productLookup.get(rp.productId)!,
          score: rp.score,
        }))
        .filter(p => p.product) // Filter out any missing products
        .slice(0, 10) // Limit to top 10 for processing
      
      // Apply links
      const linksAdded = await applyLinksToPost(
        payload,
        similarity.postId,
        productsWithScores,
        isDryRun
      )
      
      if (linksAdded > 0) {
        console.log(`   ✅ Added ${linksAdded} affiliate links (capped at ${MAX_LINKS_PER_POST})`)
        totalLinksAdded += linksAdded
        processed++
      } else {
        console.log(`   ⏭️  Skipped (no links added)`)
        skipped++
      }
      
      console.log('')
    }
    
    // Summary
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Processed: ${processed} posts`)
    console.log(`   Skipped: ${skipped} posts`)
    console.log(`   Total links added: ${totalLinksAdded}`)
    console.log(`   Average links per post: ${processed > 0 ? (totalLinksAdded / processed).toFixed(1) : 0}`)
    console.log(`   Maximum links per post: ${MAX_LINKS_PER_POST}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { applyLinksToPost, MAX_LINKS_PER_POST }