import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as crypto from 'crypto'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'affiliate-links')

// Type definitions for better type safety
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

interface ImportRequest {
  products: Product[]
  strategy: 'merge' | 'replace' | 'smart'
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  total: number
  message: string
}

// Helper function to read existing products
async function readExistingProducts(): Promise<Product[]> {
  try {
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const content = await fs.readFile(productsPath, 'utf8')
    return JSON.parse(content) || []
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

// Helper function to merge products based on strategy
function mergeProducts(existingProducts: Product[], newProducts: Product[], strategy: string): { merged: Product[], stats: { imported: number, updated: number, skipped: number } } {
  const merged = [...existingProducts]
  const stats = { imported: 0, updated: 0, skipped: 0 }

  if (strategy === 'replace') {
    return { merged: newProducts, stats: { imported: newProducts.length, updated: 0, skipped: 0 } }
  }

  for (const newProduct of newProducts) {
    // Find existing product by ID or product_url
    const existingIndex = merged.findIndex(p =>
      (p.id && newProduct.id && p.id.toString() === newProduct.id.toString()) ||
      (p.product_url && newProduct.product_url && p.product_url === newProduct.product_url) ||
      (strategy === 'smart' && p.product_name && newProduct.product_name &&
       p.product_name.toLowerCase() === newProduct.product_name.toLowerCase())
    )

    if (existingIndex >= 0) {
      // Update existing product
      merged[existingIndex] = { ...merged[existingIndex], ...newProduct }
      stats.updated++
    } else {
      // Add new product
      merged.push(newProduct)
      stats.imported++
    }
  }

  return { merged, stats }
}

// Helper function to sync products to database
async function syncProductsToDatabase(products: Product[]): Promise<{ imported: number, updated: number, skipped: number }> {
  const payload = await getPayload({ config: configPromise })
  const stats = { imported: 0, updated: 0, skipped: 0 }

  for (const product of products) {
    try {
      // Create content hash for change detection
      const contentHash = crypto.createHash('md5')
        .update(`${product.product_name}|${product.price}|${product.description}|${product.keyword_research}`)
        .digest('hex')

      // Detect language from product name and description
      const detectLanguage = (text: string): 'ja' | 'en' | 'both' => {
        const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
        const englishChars = /[a-zA-Z]/

        const hasJapanese = japaneseChars.test(text)
        const hasEnglish = englishChars.test(text)

        if (hasJapanese && hasEnglish) return 'both'
        if (hasJapanese) return 'ja'
        return 'en'
      }

      // Extract clean URL from affiliate HTML
      const extractCleanUrl = (affiliateHtml: string): string => {
        const hrefMatch = affiliateHtml?.match(/href="([^"]+)"/i)
        return hrefMatch ? hrefMatch[1] : affiliateHtml || ''
      }

      // Extract keywords from product
      const extractKeywords = (product: Product): string[] => {
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

      const language = detectLanguage((product.product_name || '') + ' ' + (product.description || ''))
      const keywords = extractKeywords(product)
      const cleanUrl = extractCleanUrl(product.affiliate_url || '')

      // Check if product already exists by original ID or product URL
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
          stats.skipped++
          continue
        }

        // Update existing product
        await payload.update({
          collection: 'affiliate-products',
          id: existingProduct.id,
          data: productData,
        })
        stats.updated++
      } else {
        // Create new product
        await payload.create({
          collection: 'affiliate-products',
          data: productData,
        })
        stats.imported++
      }

    } catch (error) {
      console.error(`❌ Error syncing product ${product.id}:`, error)
    }
  }

  return stats
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let products: Product[] = []
    let strategy: 'merge' | 'replace' | 'smart' = 'merge'

    console.log(`📨 Request Content-Type: ${contentType}`)

    if (contentType.includes('application/json')) {
      // Handle JSON request from frontend component
      const body: ImportRequest = await request.json()
      products = body.products || []
      strategy = body.strategy || 'merge'

      console.log(`📦 Processing ${products.length} products with strategy: ${strategy} (JSON request)`)
    } else {
      // Handle FormData request (file upload)
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }

      const text = await file.text()
      let data

      try {
        data = JSON.parse(text)
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON format' },
          { status: 400 }
        )
      }

      // Handle both direct array and wrapped format
      if (Array.isArray(data)) {
        products = data
      } else if (data && typeof data === 'object' && Array.isArray(data.products)) {
        products = data.products
        console.log(`📦 Processing export from folder: ${data.folder?.name || 'unknown'}`)
        console.log(`📅 Export date: ${data.export_date || 'unknown'}`)
        console.log(`📊 Total products in file: ${data.total_products || products.length}`)
      } else {
        return NextResponse.json(
          { success: false, error: 'JSON must be an array of products or contain a products array' },
          { status: 400 }
        )
      }

      // Default to replace strategy for file uploads
      strategy = 'replace'
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products to import' },
        { status: 400 }
      )
    }

    // Ensure directories exist
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true })

    // Read existing products and merge based on strategy
    const existingProducts = await readExistingProducts()
    const { merged, stats } = mergeProducts(existingProducts, products, strategy)

    // Save merged products to both locations
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const publicProductsPath = path.join(PUBLIC_DATA_DIR, 'products-index.json')

    await fs.writeFile(productsPath, JSON.stringify(merged, null, 2))
    await fs.writeFile(publicProductsPath, JSON.stringify(merged, null, 2))

    console.log(`✅ Import complete: ${stats.imported} imported, ${stats.updated} updated, ${stats.skipped} skipped`)

    // Always sync products to database
    console.log('🔄 Syncing products to database...')
    const dbStats = await syncProductsToDatabase(merged)
    console.log(`✅ Database sync: ${dbStats.imported} imported, ${dbStats.updated} updated, ${dbStats.skipped} skipped`)

    const result: ImportResult = {
      success: true,
      imported: stats.imported + dbStats.imported,
      updated: stats.updated + dbStats.updated,
      skipped: stats.skipped + dbStats.skipped,
      total: merged.length,
      message: `Successfully imported ${merged.length} products. JSON: ${stats.imported} new, ${stats.updated} updated. Database: ${dbStats.imported} new, ${dbStats.updated} updated.`
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import products',
        details: error.message
      },
      { status: 500 }
    )
  }
}