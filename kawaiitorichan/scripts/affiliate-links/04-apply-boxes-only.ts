#!/usr/bin/env tsx
/**
 * Apply ONLY product recommendation boxes to posts (no inline links)
 * Maximum 3 products per post in a styled recommendation box
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_PRODUCTS_PER_POST = 3 // Maximum number of products in recommendation box

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

/**
 * Extract clean affiliate URL from HTML
 */
function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/i)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Create a product recommendation box ONLY (no inline links)
 */
function createRecommendationBox(products: Array<{ product: ProductIndex; score: number }>): any {
  const recommendationNodes = []
  
  // Limit to MAX_PRODUCTS_PER_POST
  const limitedProducts = products.slice(0, MAX_PRODUCTS_PER_POST)
  
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
  limitedProducts.forEach((item, index) => {
    const { product } = item
    
    // Product name and price
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 1, // Bold
          mode: 'normal',
          style: '',
          text: `人気 #${index + 1}`,
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: ' ',
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: product.product_name,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    // Price
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: `価格: ${product.price}`,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    // View details link
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '詳細を見る →',
              version: 1,
            }
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 2,
          fields: {
            linkType: 'custom',
            url: product.affiliate_url,
            newTab: true,
            rel: 'nofollow sponsored',
          }
        }
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    // Add spacing between products
    if (index < limitedProducts.length - 1) {
      recommendationNodes.push({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            version: 1,
          }
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      })
    }
  })
  
  return recommendationNodes
}

/**
 * Apply ONLY recommendation boxes to a post (no inline links)
 */
async function applyBoxesToPost(
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
    
    // Clone content for modification
    const newContent = JSON.parse(JSON.stringify(post.content))
    
    // Remove any existing recommendation sections
    if (newContent.root.children) {
      let recommendationIndex = -1
      for (let i = 0; i < newContent.root.children.length; i++) {
        const child = newContent.root.children[i]
        if (child.type === 'heading' && child.children?.[0]?.text === 'おすすめ商品') {
          recommendationIndex = i
          break
        }
      }
      
      // If found, remove everything from the recommendation heading onwards
      if (recommendationIndex >= 0) {
        // Also look for a horizontal rule before it
        if (recommendationIndex > 0 && 
            newContent.root.children[recommendationIndex - 1].type === 'horizontalrule') {
          recommendationIndex--
        }
        newContent.root.children = newContent.root.children.slice(0, recommendationIndex)
      }
    }
    
    // Add recommendation box at the end
    if (products.length > 0) {
      if (!newContent.root.children) {
        newContent.root.children = []
      }
      
      // Add separator
      newContent.root.children.push({
        type: 'horizontalrule',
        version: 1,
      })
      
      // Add recommendation box
      const recommendationNodes = createRecommendationBox(products)
      newContent.root.children.push(...recommendationNodes)
      
      // Update post if not dry run
      if (!dryRun) {
        await payload.update({
          collection: 'posts',
          id: postId,
          data: {
            content: newContent,
            affiliateLinks: products.slice(0, MAX_PRODUCTS_PER_POST).map(p => ({
              productId: p.product.id,
              productName: p.product.product_name,
              anchorText: '詳細を見る',
              url: p.product.affiliate_url,
            })),
          },
        })
      }
      
      const productsAdded = Math.min(products.length, MAX_PRODUCTS_PER_POST)
      console.log(`   📦 Added recommendation box with ${productsAdded} products`)
      return productsAdded
    }
    
    return 0
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
  
  console.log('📦 Applying Product Recommendation Boxes Only (No Inline Links)')
  console.log('=' .repeat(60))
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved')
  }
  
  if (limit > 0) {
    console.log(`📊 Processing limit: ${limit} posts`)
  }
  
  console.log(`🎁 Maximum products per box: ${MAX_PRODUCTS_PER_POST}`)
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
    let totalProductsAdded = 0
    
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
        .slice(0, MAX_PRODUCTS_PER_POST) // Limit to top 3 for processing
      
      // Apply boxes
      const productsAdded = await applyBoxesToPost(
        payload,
        similarity.postId,
        productsWithScores,
        isDryRun
      )
      
      if (productsAdded > 0) {
        totalProductsAdded += productsAdded
        processed++
      } else {
        console.log(`   ⏭️  Skipped (no products added)`)
        skipped++
      }
      
      console.log('')
    }
    
    // Summary
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Processed: ${processed} posts`)
    console.log(`   Skipped: ${skipped} posts`)
    console.log(`   Total products added: ${totalProductsAdded}`)
    console.log(`   Average products per post: ${processed > 0 ? (totalProductsAdded / processed).toFixed(1) : 0}`)
    console.log(`   Maximum products per box: ${MAX_PRODUCTS_PER_POST}`)
    console.log(`   ❌ Inline links added: 0 (disabled)`)
    
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

export { applyBoxesToPost, MAX_PRODUCTS_PER_POST }