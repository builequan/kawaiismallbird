#!/usr/bin/env tsx
/**
 * Import affiliate products from JSON file
 * Supports incremental updates and duplicate detection
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

interface ProductData {
  id: number
  product_name: string
  price: string
  category: string
  commission_rate: string | null
  keyword_research: string
  affiliate_url: string
  product_url: string
  description: string
  has_embedding: boolean
  language: string
  used_in_articles: number
  created_at: string
  updated_at: string
  metadata: {
    keywords?: {
      source: string
      article_id?: number
      discovered_at?: string
      search_keyword?: string
      category?: string
      product_link?: string
    }
    is_active?: boolean
    shop_name?: string | null
    asin?: string | null
    features?: any
  }
}

interface ImportData {
  folder: {
    id: number
    name: string
    created_at: string
  }
  export_date: string
  total_products: number
  products: ProductData[]
}

/**
 * Extract clean URL from affiliate HTML code
 */
function extractCleanUrl(affiliateHtml: string): string {
  // Try to extract the main affiliate URL from the HTML
  const hrefMatch = affiliateHtml.match(/href="([^"]+)"/i)
  if (hrefMatch) {
    return hrefMatch[1]
  }
  return affiliateHtml // Return as-is if not HTML
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): 'ja' | 'en' | 'both' {
  const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  const englishChars = /[a-zA-Z]/
  
  const hasJapanese = japaneseChars.test(text)
  const hasEnglish = englishChars.test(text)
  
  if (hasJapanese && hasEnglish) return 'both'
  if (hasJapanese) return 'ja'
  return 'en'
}

/**
 * Create content hash for change detection
 */
function createContentHash(product: ProductData): string {
  const content = `${product.product_name}|${product.price}|${product.description}|${product.keyword_research}`
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Extract additional keywords from product data
 */
function extractKeywords(product: ProductData): string[] {
  const keywords = new Set<string>()
  
  // Add primary keyword
  if (product.keyword_research) {
    keywords.add(product.keyword_research)
  }
  
  // Extract from metadata
  if (product.metadata?.keywords?.search_keyword) {
    keywords.add(product.metadata.keywords.search_keyword)
  }
  
  // Extract common golf terms from product name
  const golfTerms = [
    'ゴルフ', 'クラブ', 'ボール', 'シューズ', 'グローブ', 'ウェア',
    'ドライバー', 'アイアン', 'パター', 'ウェッジ', 'バッグ',
    'ティー', 'マーカー', 'グリップ', 'シャフト', 'ヘッドカバー'
  ]
  
  for (const term of golfTerms) {
    if (product.product_name.includes(term)) {
      keywords.add(term)
    }
  }
  
  return Array.from(keywords)
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Find the latest affiliate products JSON file
    const downloadsDir = '/Users/builequan/Downloads'
    const files = await fs.readdir(downloadsDir)
    const jsonFiles = files.filter(f => f.startsWith('affiliate_products_') && f.endsWith('.json'))
    
    if (jsonFiles.length === 0) {
      console.error('No affiliate products JSON file found in Downloads folder')
      process.exit(1)
    }
    
    // Use the most recent file
    jsonFiles.sort()
    const latestFile = jsonFiles[jsonFiles.length - 1]
    const filePath = path.join(downloadsDir, latestFile)
    
    console.log(`📦 Importing products from: ${latestFile}`)
    
    // Read and parse JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const importData: ImportData = JSON.parse(fileContent)
    
    console.log(`📊 Found ${importData.total_products} products to import`)
    console.log(`📁 Source: ${importData.folder.name}`)
    console.log(`📅 Export date: ${importData.export_date}`)
    
    // Process import strategy
    const importStrategy = process.argv.includes('--replace') ? 'replace' : 'merge'
    console.log(`📋 Import strategy: ${importStrategy}`)
    
    if (importStrategy === 'replace') {
      // Delete all existing products
      console.log('🗑️  Removing existing products...')
      await payload.delete({
        collection: 'affiliate-products',
        where: {},
      })
    }
    
    // Import products
    let imported = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const product of importData.products) {
      try {
        const contentHash = createContentHash(product)
        const language = detectLanguage(product.product_name + ' ' + product.description)
        const keywords = extractKeywords(product)
        const cleanUrl = extractCleanUrl(product.affiliate_url)
        
        // Check if product already exists
        const existing = await payload.find({
          collection: 'affiliate-products',
          where: {
            'metadata.original_id': {
              equals: product.id,
            },
          },
          limit: 1,
        })
        
        const productData = {
          product_name: product.product_name,
          price: product.price,
          category: product.category || '',
          keyword_research: product.keyword_research,
          keywords: keywords.map(k => ({ keyword: k })),
          affiliate_url: product.affiliate_url,
          clean_url: cleanUrl,
          product_url: product.product_url,
          description: product.description,
          language,
          status: product.metadata?.is_active === false ? 'inactive' : 'active',
          metadata: {
            original_id: product.id,
            source: product.metadata?.keywords?.source || 'Unknown',
            commission_rate: product.commission_rate || '',
            shop_name: product.metadata?.shop_name || '',
            importedAt: new Date().toISOString(),
            lastModified: product.updated_at,
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
        console.error(`❌ Error processing product ${product.id}:`, error)
        errors++
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary:')
    console.log(`✅ Imported: ${imported} new products`)
    console.log(`🔄 Updated: ${updated} existing products`)
    console.log(`⏭️  Skipped: ${skipped} unchanged products`)
    console.log(`❌ Errors: ${errors}`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)