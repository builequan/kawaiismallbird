import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

const mainCategories = [
  { title: '🦜 鳥の種類', slug: 'bird-species', description: '様々な鳥の種類についての情報', order: 1 },
  { title: '🏠 鳥の飼い方', slug: 'bird-care', description: '鳥の基本的な飼育方法', order: 2 },
  { title: '💊 鳥の健康', slug: 'bird-health', description: '鳥の健康管理と病気の対処', order: 3 },
  { title: '🌿 鳥の生態', slug: 'bird-behavior', description: '鳥の行動と生態について', order: 4 },
  { title: '🔭 野鳥観察', slug: 'bird-watching', description: '野鳥観察の楽しみ方', order: 5 },
  { title: '🥗 餌と栄養', slug: 'nutrition-feeding', description: '鳥の餌と栄養管理', order: 6 },
]

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    const results: any[] = []
    const parentMap = new Map<string, number>()

    // Insert main categories one by one
    for (const cat of mainCategories) {
      try {
        // Check if already exists
        const existing = await payload.find({
          collection: 'categories',
          where: { slug: { equals: cat.slug } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          parentMap.set(cat.slug, existing.docs[0].id)
          results.push({ slug: cat.slug, status: 'exists', id: existing.docs[0].id })
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

        parentMap.set(cat.slug, created.id)
        results.push({ slug: cat.slug, status: 'created', id: created.id })
      } catch (error: any) {
        results.push({ slug: cat.slug, status: 'error', error: error.message })
      }
    }

    // Get final count
    const finalCount = await payload.count({ collection: 'categories' })

    return NextResponse.json({
      success: true,
      message: 'Main categories inserted',
      totalCategories: finalCount.totalDocs,
      parentMap: Object.fromEntries(parentMap),
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