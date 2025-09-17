#!/usr/bin/env tsx
/**
 * Build an index of affiliate products and posts for matching
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  description: string
  language: 'ja' | 'en' | 'both'
  anchorPhrases: string[]
  contentHash: string
  affiliate_url: string
  clean_url: string
  price: string
  status: string
}

interface PostIndex {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  language: 'ja' | 'en'
  contentHash: string
  excludeFromAffiliates: boolean
}

/**
 * Extract text from Lexical editor format
 */
function extractTextFromLexical(node: any, result: string[] = []): string {
  if (!node) return result.join('')
  
  // Handle text nodes
  if (node.type === 'text' && node.text) {
    result.push(node.text)
    return result.join('')
  }
  
  // Handle nodes with children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractTextFromLexical(child, result)
    }
  }
  
  return result.join('')
}

/**
 * Extract anchor phrases from product data
 */
function extractAnchorPhrases(product: any): string[] {
  const phrases = new Set<string>()
  
  // Add primary keyword
  if (product.keyword_research) {
    phrases.add(product.keyword_research)
  }
  
  // Add additional keywords
  if (product.keywords && Array.isArray(product.keywords)) {
    for (const kw of product.keywords) {
      if (kw.keyword) {
        phrases.add(kw.keyword)
      }
    }
  }
  
  // Extract Japanese golf-specific terms from product name
  const golfPhrases = [
    // Equipment
    'ゴルフクラブ', 'ドライバー', 'アイアン', 'パター', 'ウェッジ',
    'フェアウェイウッド', 'ユーティリティ', 'サンドウェッジ', 'ピッチングウェッジ',
    'ゴルフボール', 'ゴルフシューズ', 'ゴルフグローブ', 'キャディバッグ',
    
    // Accessories
    'ティー', 'マーカー', 'グリップ', 'シャフト', 'ヘッドカバー',
    'レンジファインダー', '距離計', 'スコアカード', 'グリーンフォーク',
    
    // Apparel
    'ゴルフウェア', 'ポロシャツ', 'ゴルフパンツ', 'レインウェア',
    'サンバイザー', 'キャップ', 'ゴルフソックス',
    
    // Training
    '練習器具', 'スイング練習', 'パッティング練習', 'トレーニング用品',
    '素振り', '練習マット', 'ネット',
    
    // Generic terms that might appear
    'ゴルフ用品', 'ゴルフグッズ', 'ゴルフアクセサリー',
  ]
  
  // Check if product name contains any golf phrases
  for (const phrase of golfPhrases) {
    if (product.product_name.includes(phrase)) {
      phrases.add(phrase)
    }
  }
  
  // Extract brand names (katakana sequences)
  const katakanaPattern = /[\u30A0-\u30FF]+/g
  const katakanaMatches = product.product_name.match(katakanaPattern)
  if (katakanaMatches) {
    for (const match of katakanaMatches) {
      if (match.length >= 3) { // Only meaningful brand names
        phrases.add(match)
      }
    }
  }
  
  return Array.from(phrases)
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): 'ja' | 'en' {
  const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  const japaneseCount = (text.match(japaneseChars) || []).length
  const totalChars = text.length
  
  // If more than 20% Japanese characters, consider it Japanese
  return (japaneseCount / totalChars) > 0.2 ? 'ja' : 'en'
}

/**
 * Create content hash
 */
function createHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    
    console.log('📚 Building affiliate product and post indices...')
    
    // 1. Build product index
    console.log('\n📦 Fetching affiliate products...')
    const products = await payload.find({
      collection: 'affiliate-products',
      where: {
        status: {
          equals: 'active',
        },
      },
      limit: 10000,
    })
    
    console.log(`Found ${products.docs.length} active products`)
    
    const productIndex: ProductIndex[] = []
    
    for (const product of products.docs) {
      const anchorPhrases = extractAnchorPhrases(product)
      
      productIndex.push({
        id: product.id,
        product_name: product.product_name,
        keyword_research: product.keyword_research,
        keywords: product.keywords?.map((k: any) => k.keyword) || [],
        description: product.description || '',
        language: product.language as 'ja' | 'en' | 'both',
        anchorPhrases,
        contentHash: product.metadata?.contentHash || '',
        affiliate_url: product.affiliate_url,
        clean_url: product.clean_url || product.affiliate_url,
        price: product.price || '',
        status: product.status,
      })
    }
    
    // Save product index
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'products-index.json'),
      JSON.stringify(productIndex, null, 2)
    )
    console.log(`✅ Saved product index with ${productIndex.length} products`)
    
    // 2. Build post index
    console.log('\n📝 Fetching posts...')
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      limit: 10000,
    })
    
    console.log(`Found ${posts.docs.length} published posts`)
    
    const postIndex: PostIndex[] = []
    
    for (const post of posts.docs) {
      // Extract text content
      let textContent = ''
      if (post.content_html) {
        // Remove HTML tags
        textContent = post.content_html.replace(/<[^>]*>/g, ' ')
      } else if (post.content) {
        textContent = extractTextFromLexical(post.content)
      }
      
      const language = detectLanguage(post.title + ' ' + textContent)
      
      postIndex.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: textContent.substring(0, 5000), // Limit content for index
        language,
        contentHash: createHash(textContent),
        excludeFromAffiliates: post.affiliateLinksMetadata?.excludeFromAffiliates || false,
      })
    }
    
    // Save post index
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'posts-index.json'),
      JSON.stringify(postIndex, null, 2)
    )
    console.log(`✅ Saved post index with ${postIndex.length} posts`)
    
    // 3. Create summary statistics
    const stats = {
      products: {
        total: productIndex.length,
        japanese: productIndex.filter(p => p.language === 'ja').length,
        english: productIndex.filter(p => p.language === 'en').length,
        both: productIndex.filter(p => p.language === 'both').length,
      },
      posts: {
        total: postIndex.length,
        japanese: postIndex.filter(p => p.language === 'ja').length,
        english: postIndex.filter(p => p.language === 'en').length,
        excluded: postIndex.filter(p => p.excludeFromAffiliates).length,
      },
      anchorPhrases: {
        total: productIndex.reduce((sum, p) => sum + p.anchorPhrases.length, 0),
        unique: new Set(productIndex.flatMap(p => p.anchorPhrases)).size,
      },
      timestamp: new Date().toISOString(),
    }
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'index-stats.json'),
      JSON.stringify(stats, null, 2)
    )
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 Index Building Complete!')
    console.log('='.repeat(50))
    console.log(`📦 Products indexed: ${stats.products.total}`)
    console.log(`   - Japanese: ${stats.products.japanese}`)
    console.log(`   - English: ${stats.products.english}`)
    console.log(`   - Both: ${stats.products.both}`)
    console.log(`📝 Posts indexed: ${stats.posts.total}`)
    console.log(`   - Japanese: ${stats.posts.japanese}`)
    console.log(`   - English: ${stats.posts.english}`)
    console.log(`   - Excluded: ${stats.posts.excluded}`)
    console.log(`🔗 Anchor phrases: ${stats.anchorPhrases.unique} unique`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error building index:', error)
    process.exit(1)
  }
}

main().catch(console.error)