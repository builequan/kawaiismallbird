#!/usr/bin/env tsx
/**
 * Improved affiliate link application with better relevance matching
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface SimilarityResult {
  postId: string
  postSlug: string
  relevantProducts: Array<{
    productId: string | number
    productName: string
    score: number
    matchType: string
    matchedKeywords: string[]
    category?: string
  }>
}

interface ProductIndex {
  id: string | number
  product_name: string
  keyword_research: string
  keywords: string[]
  affiliate_url: string
  price?: string
  image_url?: string
  category?: string
}

/**
 * Categorize products based on their name and keywords
 */
function categorizeProduct(product: ProductIndex): string {
  const name = product.product_name.toLowerCase()
  const keywords = [product.keyword_research, ...product.keywords].join(' ').toLowerCase()
  
  // Golf equipment categories
  if (name.includes('ボール') && name.includes('ゴルフ')) return 'golf-ball'
  if (name.includes('ドライバー') || (name.includes('driver') && keywords.includes('ゴルフ'))) return 'driver'
  if (name.includes('アイアン') || (name.includes('iron') && keywords.includes('ゴルフ'))) return 'iron'
  if (name.includes('パター') || (name.includes('putter') && keywords.includes('ゴルフ'))) return 'putter'
  if (name.includes('ウェッジ') || (name.includes('wedge') && keywords.includes('ゴルフ'))) return 'wedge'
  if (name.includes('グローブ') && keywords.includes('ゴルフ')) return 'glove'
  if (name.includes('シューズ') && keywords.includes('ゴルフ')) return 'shoes'
  if (name.includes('バッグ') && keywords.includes('ゴルフ')) return 'bag'
  if (name.includes('ティー') && keywords.includes('ゴルフ')) return 'tee'
  if (name.includes('マーカー') && keywords.includes('ゴルフ')) return 'marker'
  if (name.includes('レンジファインダー')) return 'rangefinder'
  if (name.includes('ゴルフウェア') || (name.includes('wear') && keywords.includes('ゴルフ'))) return 'wear'
  
  // Training aids
  if (name.includes('練習') && keywords.includes('ゴルフ')) return 'training'
  if (name.includes('マット') && keywords.includes('ゴルフ')) return 'mat'
  if (name.includes('ネット') && keywords.includes('ゴルフ')) return 'net'
  
  // Non-golf items (should be excluded unless specifically mentioned)
  if (name.includes('ソックス') && !keywords.includes('ゴルフ')) return 'socks-non-golf'
  if (name.includes('プロテイン') || name.includes('タンパク')) return 'protein'
  
  // Golf-related general items
  if (keywords.includes('ゴルフ')) return 'golf-general'
  
  return 'other'
}

/**
 * Check if product is relevant to post content
 */
function isProductRelevantToPost(product: ProductIndex, postContent: string): boolean {
  const category = categorizeProduct(product)
  const postLower = postContent.toLowerCase()
  
  // Exclude completely non-golf items
  if (category === 'socks-non-golf') {
    return postLower.includes('ソックス') || postLower.includes('靴下')
  }
  
  if (category === 'protein') {
    return postLower.includes('プロテイン') || postLower.includes('タンパク') || postLower.includes('栄養')
  }
  
  if (category === 'other') {
    // Only include if the specific product keyword is mentioned
    return postLower.includes(product.keyword_research.toLowerCase())
  }
  
  // For golf-related items, be more lenient
  if (category.startsWith('golf') || ['driver', 'iron', 'putter', 'wedge', 'glove', 'shoes', 'bag', 'tee', 'marker', 'rangefinder', 'wear', 'training', 'mat', 'net'].includes(category)) {
    // Check if the post is about golf
    const golfKeywords = ['ゴルフ', 'スイング', 'ショット', 'コース', 'ラウンド']
    const hasGolfContext = golfKeywords.some(keyword => postLower.includes(keyword))
    
    if (!hasGolfContext) return false
    
    // For specific equipment, check for related terms
    if (category === 'driver' && (postLower.includes('ドライバー') || postLower.includes('ティーショット') || postLower.includes('飛距離'))) {
      return true
    }
    if (category === 'iron' && (postLower.includes('アイアン') || postLower.includes('アプローチ'))) {
      return true
    }
    if (category === 'putter' && (postLower.includes('パター') || postLower.includes('パッティング') || postLower.includes('グリーン'))) {
      return true
    }
    if (category === 'wedge' && (postLower.includes('ウェッジ') || postLower.includes('バンカー') || postLower.includes('アプローチ'))) {
      return true
    }
    
    // For general golf items, be more lenient
    if (category === 'golf-general' || category === 'golf-ball') {
      return true
    }
    
    // Check if the specific keyword is mentioned
    if (postLower.includes(product.keyword_research.toLowerCase())) {
      return true
    }
    
    // Check for any keyword match
    return product.keywords.some(kw => postLower.includes(kw.toLowerCase()))
  }
  
  return false
}

/**
 * Extract clean URL from affiliate HTML
 */
function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Hash content for change detection
 */
function hashContent(content: any): string {
  const contentStr = JSON.stringify(content)
  return crypto.createHash('md5').update(contentStr).digest('hex')
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🔗 Applying improved affiliate links...')
    
    // Load data
    const similarityPath = path.join(DATA_DIR, 'similarity-matrix.json')
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    
    const similarities: SimilarityResult[] = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    
    // Create product lookup with categories
    const productMap = new Map<string | number, ProductIndex>()
    for (const product of products) {
      productMap.set(product.id, {
        ...product,
        category: categorizeProduct(product)
      })
    }
    
    // Process options
    const dryRun = process.argv.includes('--dry-run')
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : similarities.length
    
    const postsToProcess = similarities.slice(0, limit)
    console.log(`📝 Processing ${postsToProcess.length} posts (${dryRun ? 'DRY RUN' : 'LIVE'})\n`)
    
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
        
        // Extract text content for relevance checking
        const postContent = JSON.stringify(post.content) + ' ' + post.title
        
        // Filter products for relevance
        const relevantProducts = similarity.relevantProducts
          .map(rp => {
            const product = productMap.get(rp.productId)
            if (!product) return null
            
            // Check relevance
            if (!isProductRelevantToPost(product, postContent)) {
              return null
            }
            
            return product
          })
          .filter(p => p)
          .slice(0, 3) as ProductIndex[] // Max 3 products
        
        if (relevantProducts.length === 0) {
          console.log(`⏭️  No relevant products for: ${post.title}`)
          skipped++
          continue
        }
        
        console.log(`\n📄 Processing: ${post.title}`)
        console.log(`  ✅ Found ${relevantProducts.length} relevant products:`)
        relevantProducts.forEach(p => {
          console.log(`    - ${p.product_name.substring(0, 50)}... (${p.category})`)
        })
        
        if (dryRun) {
          console.log(`  🔵 DRY RUN - Would apply ${relevantProducts.length} affiliate links`)
          processed++
          continue
        }
        
        // Calculate content hash
        const contentHash = hashContent(post.content)
        
        // Update post metadata
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            affiliateLinksMetadata: {
              linksAdded: relevantProducts.map(product => ({
                productId: String(product.id),
                productName: product.product_name,
                url: extractAffiliateUrl(product.affiliate_url),
                addedAt: new Date().toISOString(),
              })),
              lastProcessed: new Date().toISOString(),
              version: '2.0',
              contentHash,
            },
          },
        })
        
        console.log(`  ✅ Applied ${relevantProducts.length} affiliate links`)
        processed++
        
      } catch (error) {
        console.error(`\n❌ Error processing post ${similarity.postId}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Improved affiliate link processing complete!')
    console.log('='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main().catch(console.error)