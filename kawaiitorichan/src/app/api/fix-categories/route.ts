import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const categories = [
  // Main categories
  { id: 1, title: '🦜 鳥の種類', slug: 'bird-species', description: '様々な鳥の種類についての情報', order: 1, parent: null },
  { id: 2, title: '🏠 鳥の飼い方', slug: 'bird-care', description: '鳥の基本的な飼育方法', order: 2, parent: null },
  { id: 3, title: '💊 鳥の健康', slug: 'bird-health', description: '鳥の健康管理と病気の対処', order: 3, parent: null },
  { id: 4, title: '🌿 鳥の生態', slug: 'bird-behavior', description: '鳥の行動と生態について', order: 4, parent: null },
  { id: 5, title: '🔭 野鳥観察', slug: 'bird-watching', description: '野鳥観察の楽しみ方', order: 5, parent: null },
  { id: 6, title: '🥗 餌と栄養', slug: 'nutrition-feeding', description: '鳥の餌と栄養管理', order: 6, parent: null },

  // Bird Species subcategories
  { id: 101, title: 'セキセイインコ', slug: 'budgerigar', description: '明るく社交的なセキセイインコ', order: 1, parent: 1 },
  { id: 102, title: 'オカメインコ', slug: 'cockatiel', description: '優しいオカメインコ', order: 2, parent: 1 },
  { id: 103, title: 'ラブバード', slug: 'lovebird', description: '愛情深いラブバード', order: 3, parent: 1 },
  { id: 104, title: 'ゼブラフィンチ', slug: 'zebra-finch', description: 'ゼブラフィンチ', order: 4, parent: 1 },
  { id: 105, title: '文鳥', slug: 'society-finch', description: '文鳥', order: 5, parent: 1 },
  { id: 106, title: 'ゴシキキンカン', slug: 'gouldian-finch', description: 'ゴシキキンカン', order: 6, parent: 1 },
  { id: 107, title: 'カナリア', slug: 'canary', description: 'カナリア', order: 7, parent: 1 },
  { id: 108, title: 'マメルリハ', slug: 'parrotlet', description: 'マメルリハ', order: 8, parent: 1 },
  { id: 109, title: 'ジュウシマツ', slug: 'munias', description: 'ジュウシマツ', order: 9, parent: 1 },

  // Bird Care subcategories
  { id: 201, title: 'ケージと飼育環境', slug: 'housing-enclosures', description: 'ケージの選び方', order: 1, parent: 2 },
  { id: 202, title: 'ケージサイズと設置', slug: 'cage-setup', description: 'ケージのサイズ', order: 2, parent: 2 },
  { id: 203, title: '止まり木と設備', slug: 'perches-accessories', description: '止まり木', order: 3, parent: 2 },
  { id: 204, title: '温度と湿度管理', slug: 'temperature-humidity', description: '温度管理', order: 4, parent: 2 },
  { id: 205, title: '照明設備', slug: 'lighting', description: '照明', order: 5, parent: 2 },
  { id: 206, title: '清掃と衛生管理', slug: 'cleaning-hygiene', description: '清掃', order: 6, parent: 2 },

  // Bird Health subcategories
  { id: 301, title: '日常の健康管理', slug: 'daily-health-care', description: '健康チェック', order: 1, parent: 3 },
  { id: 302, title: '病気の症状と対処', slug: 'illness-treatment', description: '病気の対処', order: 2, parent: 3 },
  { id: 303, title: '応急処置', slug: 'emergency-care', description: '応急処置', order: 3, parent: 3 },
  { id: 304, title: '獣医師の診察', slug: 'veterinary-care', description: '獣医師', order: 4, parent: 3 },
  { id: 305, title: '換羽期のケア', slug: 'molting-care', description: '換羽期', order: 5, parent: 3 },
  { id: 306, title: '繁殖と産卵', slug: 'breeding-care', description: '繁殖', order: 6, parent: 3 },

  // Bird Behavior subcategories
  { id: 401, title: '鳴き声と意思疎通', slug: 'vocalizations', description: '鳴き声', order: 1, parent: 4 },
  { id: 402, title: '行動パターン', slug: 'behavior-patterns', description: '行動', order: 2, parent: 4 },
  { id: 403, title: 'しつけと訓練', slug: 'training', description: 'しつけ', order: 3, parent: 4 },
  { id: 404, title: 'ストレス管理', slug: 'stress-management', description: 'ストレス', order: 4, parent: 4 },
  { id: 405, title: '社会性と多頭飼い', slug: 'social-behavior', description: '社会性', order: 5, parent: 4 },
  { id: 406, title: '遊びと運動', slug: 'play-exercise', description: '遊び', order: 6, parent: 4 },

  // Bird Watching subcategories
  { id: 501, title: '観察の基本', slug: 'observation-basics', description: '観察基本', order: 1, parent: 5 },
  { id: 502, title: '観察場所', slug: 'observation-locations', description: '観察場所', order: 2, parent: 5 },
  { id: 503, title: '観察用具', slug: 'observation-equipment', description: '観察用具', order: 3, parent: 5 },
  { id: 504, title: '季節別観察', slug: 'seasonal-observation', description: '季節別', order: 4, parent: 5 },
  { id: 505, title: '記録と写真', slug: 'recording-photography', description: '記録', order: 5, parent: 5 },
  { id: 506, title: '保護と環境', slug: 'conservation', description: '保護', order: 6, parent: 5 },

  // Nutrition subcategories
  { id: 601, title: '基本的な餌', slug: 'basic-diet', description: '基本的な餌', order: 1, parent: 6 },
  { id: 602, title: '新鮮な野菜と果物', slug: 'fresh-foods', description: '野菜と果物', order: 2, parent: 6 },
  { id: 603, title: 'タンパク質源', slug: 'protein-sources', description: 'タンパク質', order: 3, parent: 6 },
  { id: 604, title: 'サプリメント', slug: 'supplements', description: 'サプリメント', order: 4, parent: 6 },
  { id: 605, title: '危険な食べ物', slug: 'toxic-foods', description: '危険な食べ物', order: 5, parent: 6 },
  { id: 606, title: '給餌スケジュール', slug: 'feeding-schedule', description: '給餌', order: 6, parent: 6 },
  { id: 607, title: '水分補給', slug: 'hydration', description: '水分', order: 7, parent: 6 },
  { id: 608, title: '季節別の栄養', slug: 'seasonal-nutrition', description: '季節別栄養', order: 8, parent: 6 },
]

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Check current category count
    const currentCount = await payload.count({ collection: 'categories' })

    const results = []
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    // Map to store old ID -> new ID mappings for parent relationships
    const idMap = new Map<number, number>()

    // Separate main categories and subcategories
    const mainCategories = categories.filter(c => c.parent === null)
    const subCategories = categories.filter(c => c.parent !== null)

    // Insert main categories first (without specifying ID)
    for (const cat of mainCategories) {
      try {
        // Check if category with this slug already exists
        const existing = await payload.find({
          collection: 'categories',
          where: { slug: { equals: cat.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          idMap.set(cat.id, existing.docs[0].id)
          skippedCount++
          results.push({
            oldId: cat.id,
            newId: existing.docs[0].id,
            title: cat.title,
            status: 'already_exists'
          })
          continue
        }

        const created = await payload.create({
          collection: 'categories',
          data: {
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            slugLock: true,
          },
        })

        // Store the mapping of old ID to new ID
        idMap.set(cat.id, created.id)
        successCount++
        results.push({
          oldId: cat.id,
          newId: created.id,
          title: cat.title,
          status: 'created'
        })
      } catch (error: any) {
        errorCount++
        results.push({
          oldId: cat.id,
          title: cat.title,
          status: 'error',
          error: error.message
        })
      }
    }

    // Now insert subcategories with proper parent references
    for (const cat of subCategories) {
      try {
        // Check if category with this slug already exists
        const existing = await payload.find({
          collection: 'categories',
          where: { slug: { equals: cat.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          skippedCount++
          results.push({
            oldId: cat.id,
            newId: existing.docs[0].id,
            title: cat.title,
            status: 'already_exists'
          })
          continue
        }

        // Get the new parent ID from the map
        const newParentId = cat.parent ? idMap.get(cat.parent) : null

        if (cat.parent && !newParentId) {
          errorCount++
          results.push({
            oldId: cat.id,
            title: cat.title,
            status: 'error',
            error: `Parent category ${cat.parent} not found`
          })
          continue
        }

        const created = await payload.create({
          collection: 'categories',
          data: {
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            slugLock: true,
            parent: newParentId,
          },
        })

        successCount++
        results.push({
          oldId: cat.id,
          newId: created.id,
          title: cat.title,
          status: 'created',
          parentId: newParentId
        })
      } catch (error: any) {
        errorCount++
        results.push({
          oldId: cat.id,
          title: cat.title,
          status: 'error',
          error: error.message
        })
      }
    }

    // Verify final count
    const finalCount = await payload.count({ collection: 'categories' })

    return NextResponse.json({
      success: true,
      message: `Inserted ${successCount} categories, ${skippedCount} already existed, ${errorCount} errors`,
      categoriesInserted: successCount,
      skipped: skippedCount,
      errors: errorCount,
      finalCount: finalCount.totalDocs,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}