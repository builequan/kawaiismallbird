#!/usr/bin/env tsx
/**
 * Simple version - Apply affiliate links to posts as HTML
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

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
  affiliate_url: string
  clean_url: string
  price: string
}

/**
 * Extract clean affiliate URL
 */
function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🔗 Applying affiliate links to posts...')
    
    // Load data
    const similarityPath = path.join(DATA_DIR, 'similarity-matrix.json')
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    
    if (!await fs.access(similarityPath).then(() => true).catch(() => false)) {
      console.error('❌ Similarity matrix not found. Run 03-compute-similarity.ts first.')
      process.exit(1)
    }
    
    const similarities: SimilarityResult[] = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    
    // Create product lookup
    const productMap = new Map<string, ProductIndex>()
    for (const product of products) {
      productMap.set(product.id, product)
    }
    
    // Process options
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : 5
    
    const postsToProcess = similarities.slice(0, limit)
    console.log(`📝 Processing ${postsToProcess.length} posts`)
    
    let processed = 0
    let skipped = 0
    let errors = 0
    
    for (const similarity of postsToProcess) {
      try {
        // Fetch the post
        const post = await payload.findByID({
          collection: 'posts',
          id: similarity.postId,
        })
        
        if (!post) {
          console.log(`⚠️  Post not found: ${similarity.postId}`)
          skipped++
          continue
        }
        
        // Get the first 2 products for recommendations
        const recommendProducts = similarity.relevantProducts
          .slice(0, 2)
          .map(rp => productMap.get(rp.productId))
          .filter(p => p)
        
        if (recommendProducts.length === 0) {
          console.log(`⚠️  No valid products for: ${post.title}`)
          skipped++
          continue
        }
        
        // Create simple HTML recommendation section
        let recommendationHtml = '\n\n<h3>おすすめ商品</h3>\n\n'
        
        for (const product of recommendProducts) {
          const url = extractAffiliateUrl(product.affiliate_url)
          recommendationHtml += `<p><strong>${product.product_name}</strong></p>\n`
          recommendationHtml += `<p>価格: ${product.price}</p>\n`
          recommendationHtml += `<p><a href="${url}" target="_blank" rel="nofollow sponsored" style="color: #0066cc; text-decoration: underline;">詳細を見る →</a></p>\n\n`
        }
        
        // Update the post's content_html field
        const updatedHtml = (post.content_html || '') + recommendationHtml
        
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content_html: updatedHtml,
          },
        })
        
        console.log(`✅ Added ${recommendProducts.length} affiliate links to: ${post.title}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Error processing post ${similarity.postId}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Affiliate link application complete!')
    console.log('='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error applying affiliate links:', error)
    process.exit(1)
  }
}

main().catch(console.error)