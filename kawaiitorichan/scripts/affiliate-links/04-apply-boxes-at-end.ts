#!/usr/bin/env tsx
/**
 * Apply product recommendation boxes at the VERY END of posts
 * Removes ALL existing affiliate content first, then adds boxes at the end
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_PRODUCTS_PER_POST = 3

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
 * Remove ALL affiliate content from the post
 */
function removeAllAffiliateContent(content: any): any {
  if (!content?.root?.children) return content
  
  const cleanContent = JSON.parse(JSON.stringify(content))
  const newChildren = []
  let skipUntilNonAffiliate = false
  
  for (let i = 0; i < cleanContent.root.children.length; i++) {
    const child = cleanContent.root.children[i]
    
    // Check if this is the start of a recommendation section
    if (child.type === 'heading' && child.children?.[0]?.text === 'おすすめ商品') {
      skipUntilNonAffiliate = true
      // Also remove the horizontal rule before it if it exists
      if (newChildren.length > 0 && newChildren[newChildren.length - 1].type === 'horizontalrule') {
        newChildren.pop()
      }
      continue
    }
    
    // If we're in a recommendation section, skip everything
    if (skipUntilNonAffiliate) {
      // Check if this marks the end of affiliate content
      if (child.type === 'heading' && child.children?.[0]?.text !== 'おすすめ商品') {
        skipUntilNonAffiliate = false
        newChildren.push(child)
      }
      continue
    }
    
    // Remove inline affiliate links
    if (child.type === 'paragraph' && child.children) {
      const cleanedParagraph = removeAffiliateLinksFromParagraph(child)
      if (cleanedParagraph) {
        newChildren.push(cleanedParagraph)
      }
    } else {
      newChildren.push(child)
    }
  }
  
  cleanContent.root.children = newChildren
  return cleanContent
}

/**
 * Remove affiliate links from a paragraph, converting them to plain text
 */
function removeAffiliateLinksFromParagraph(paragraph: any): any {
  const newParagraph = JSON.parse(JSON.stringify(paragraph))
  
  function processNode(node: any): any {
    if (!node) return node
    
    // If it's an affiliate link, convert to plain text
    if (node.type === 'link' && node.fields?.url && 
        (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
      return {
        type: 'text',
        text: node.children?.[0]?.text || '',
        version: 1
      }
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(child => processNode(child))
    }
    
    return node
  }
  
  return processNode(newParagraph)
}

/**
 * Create a clean product recommendation box
 */
function createRecommendationBox(products: Array<{ product: ProductIndex; score: number }>): any {
  const recommendationNodes = []
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
  
  // Add description
  recommendationNodes.push({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: '記事内でご紹介した商品',
        version: 1,
      }
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  })
  
  // Add products
  limitedProducts.forEach((item, index) => {
    const { product } = item
    
    // Add spacing
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: '',
          version: 1,
        }
      ],
      version: 1,
    })
    
    // Product with ranking
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
          text: '  ',
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
  })
  
  return recommendationNodes
}

/**
 * Apply recommendation box at the VERY END of the post
 */
async function applyBoxAtEnd(
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
    
    // Step 1: Remove ALL existing affiliate content
    const cleanContent = removeAllAffiliateContent(post.content)
    
    // Step 2: Add recommendation box at the very end
    if (products.length > 0) {
      if (!cleanContent.root.children) {
        cleanContent.root.children = []
      }
      
      // Ensure there's some spacing before the recommendation
      const lastChild = cleanContent.root.children[cleanContent.root.children.length - 1]
      if (lastChild && lastChild.type !== 'paragraph' || 
          (lastChild?.children?.[0]?.text && lastChild.children[0].text.trim() !== '')) {
        // Add empty paragraph for spacing
        cleanContent.root.children.push({
          type: 'paragraph',
          children: [{ type: 'text', text: '', version: 1 }],
          version: 1,
        })
      }
      
      // Add separator
      cleanContent.root.children.push({
        type: 'horizontalrule',
        version: 1,
      })
      
      // Add recommendation box
      const recommendationNodes = createRecommendationBox(products)
      cleanContent.root.children.push(...recommendationNodes)
      
      // Update post if not dry run
      if (!dryRun) {
        await payload.update({
          collection: 'posts',
          id: postId,
          data: {
            content: cleanContent,
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
      console.log(`   ✅ Added ${productsAdded} products at END of post`)
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
  
  console.log('📦 Applying Product Boxes at END of Posts')
  console.log('=' .repeat(60))
  console.log('🧹 Will remove ALL existing affiliate content first')
  console.log('📍 Then add recommendation box at the VERY END')
  
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
        .filter(p => p.product)
        .slice(0, MAX_PRODUCTS_PER_POST)
      
      // Apply box at end
      const productsAdded = await applyBoxAtEnd(
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
    console.log(`   Location: END of posts (after all content)`)
    
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

export { applyBoxAtEnd, MAX_PRODUCTS_PER_POST }