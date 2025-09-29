import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get all categories
    const allCategories = await payload.find({
      collection: 'categories',
      limit: 100,
      depth: 0,
    })

    // Separate main and subcategories
    const mainCategories = allCategories.docs.filter(c => !c.parent)
    const subCategories = allCategories.docs.filter(c => c.parent)

    // Find orphaned subcategories (parent doesn't exist)
    const parentIds = new Set(mainCategories.map(c => c.id))
    const orphanedCategories = subCategories.filter(c => {
      const parentId = typeof c.parent === 'object' ? c.parent.id : c.parent
      return !parentIds.has(parentId)
    })

    return NextResponse.json({
      success: true,
      total: allCategories.totalDocs,
      mainCategories: mainCategories.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
      })),
      mainCategoriesCount: mainCategories.length,
      subCategoriesCount: subCategories.length,
      orphanedCategories: orphanedCategories.map(c => ({
        id: c.id,
        title: c.title,
        parent: c.parent,
      })),
      orphanedCount: orphanedCategories.length,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}