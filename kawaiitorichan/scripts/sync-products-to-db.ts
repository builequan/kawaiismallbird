#!/usr/bin/env tsx
/**
 * Sync JSON products to database
 * This imports products from the JSON file to the Payload database
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

interface Product {
  id: number | string
  product_name: string
  product_url?: string
  affiliate_url?: string
  price?: string
  category?: string
  keyword_research?: string
  description?: string
  language?: string
  metadata?: any
  [key: string]: any
}

// Helper functions
function detectLanguage(text: string): 'ja' | 'en' | 'both' {
  const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  const englishChars = /[a-zA-Z]/

  const hasJapanese = japaneseChars.test(text)
  const hasEnglish = englishChars.test(text)

  if (hasJapanese && hasEnglish) return 'both'
  if (hasJapanese) return 'ja'
  return 'en'
}

function extractCleanUrl(affiliateHtml: string): string {
  const hrefMatch = affiliateHtml?.match(/href="([^"]+)"/i)
  return hrefMatch ? hrefMatch[1] : affiliateHtml || ''
}

function extractKeywords(product: Product): string[] {
  const keywords = new Set<string>()

  if (product.keyword_research) {
    keywords.add(product.keyword_research)
  }

  // Add common terms found in product name
  const commonTerms = [
    'ゴルフ', 'クラブ', 'ボール', 'シューズ', 'グローブ', 'ウェア',
    'ドライバー', 'アイアン', 'パター', 'ウェッジ', 'バッグ',
    'ティー', 'マーカー', 'グリップ', 'シャフト', 'ヘッドカバー',
    '小鳥', 'インコ', 'オウム', 'ケージ', 'エサ', 'おもちゃ',
    'とまり木', '水入れ', 'エサ入れ', 'カバー'
  ]

  for (const term of commonTerms) {
    if (product.product_name?.includes(term)) {
      keywords.add(term)
    }
  }

  return Array.from(keywords)
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Read products from JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'affiliate-links', 'products-index.json')
    console.log(`📖 Reading products from: ${jsonPath}`)

    const jsonContent = await fs.readFile(jsonPath, 'utf8')
    const products: Product[] = JSON.parse(jsonContent)

    console.log(`📦 Found ${products.length} products to sync`)

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const product of products) {
      try {
        // Create content hash for change detection
        const contentHash = crypto.createHash('md5')
          .update(`${product.product_name}|${product.price}|${product.description}|${product.keyword_research}`)
          .digest('hex')

        const language = detectLanguage((product.product_name || '') + ' ' + (product.description || ''))
        const keywords = extractKeywords(product)
        const cleanUrl = extractCleanUrl(product.affiliate_url || '')

        // Check if product already exists
        const existing = await payload.find({
          collection: 'affiliate-products',
          where: {
            or: [
              {
                'metadata.original_id': {
                  equals: product.id,
                },
              },
              {
                clean_url: {
                  equals: cleanUrl,
                },
              },
            ],
          },
          limit: 1,
        })

        const productData = {
          product_name: product.product_name || '',
          price: product.price || '',
          category: product.category || '',
          keyword_research: product.keyword_research || '',
          keywords: keywords.map(k => ({ keyword: k })),
          affiliate_url: product.affiliate_url || '',
          clean_url: cleanUrl,
          product_url: product.product_url || '',
          description: product.description || '',
          language,
          status: (product.metadata?.is_active === false) ? 'inactive' : 'active',
          metadata: {
            original_id: Number(product.id) || 0,
            source: product.metadata?.keywords?.source || 'JSON Import',
            commission_rate: product.commission_rate || '',
            shop_name: product.metadata?.shop_name || '',
            importedAt: new Date().toISOString(),
            lastModified: product.updated_at || new Date().toISOString(),
            contentHash,
          },
          performance: {
            usageCount: product.used_in_articles || 0,
            clickCount: 0,
            performanceScore: 0,
          },
        }

        if (existing.docs.length > 0) {
          const existingProduct = existing.docs[0]

          // Check if content has changed
          if (existingProduct.metadata?.contentHash === contentHash) {
            console.log(`⏭️  Skipping unchanged: ${product.product_name}`)
            skipped++
            continue
          }

          // Update existing product
          await payload.update({
            collection: 'affiliate-products',
            id: existingProduct.id,
            data: productData,
          })
          console.log(`✅ Updated: ${product.product_name}`)
          updated++
        } else {
          // Create new product
          await payload.create({
            collection: 'affiliate-products',
            data: productData,
          })
          console.log(`✅ Imported: ${product.product_name}`)
          imported++
        }

      } catch (error) {
        console.error(`❌ Error syncing product ${product.id}:`, error)
      }
    }

    console.log('\n📊 Sync Complete!')
    console.log(`✅ Imported: ${imported}`)
    console.log(`🔄 Updated: ${updated}`)
    console.log(`⏭️  Skipped: ${skipped}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  }
}

main()