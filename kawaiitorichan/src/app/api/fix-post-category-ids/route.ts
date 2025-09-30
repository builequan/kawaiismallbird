import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Check what category IDs posts are referencing
    const postCategoryRefs = await payload.db.drizzle.execute(sql`
      SELECT DISTINCT categories_id, COUNT(*) as post_count
      FROM posts_rels
      WHERE categories_id IS NOT NULL
      GROUP BY categories_id
      ORDER BY categories_id;
    `)

    // Get existing categories
    const existingCategories = await payload.db.drizzle.execute(sql`
      SELECT id, slug FROM categories ORDER BY id;
    `)

    const categoryMap = new Map<number, number>()
    for (const cat of existingCategories.rows) {
      const slug = cat.slug as string
      const id = cat.id as number

      // Map old IDs to new IDs based on slug
      if (slug === 'bird-species') categoryMap.set(1, id)
      if (slug === 'bird-care') categoryMap.set(2, id)
      if (slug === 'bird-health') categoryMap.set(3, id)
      if (slug === 'bird-behavior') categoryMap.set(4, id)
      if (slug === 'bird-watching') categoryMap.set(5, id)
      if (slug === 'nutrition-feeding') categoryMap.set(6, id)
    }

    // Update posts_rels to fix category references
    let updateCount = 0
    for (const [oldId, newId] of categoryMap.entries()) {
      const result = await payload.db.drizzle.execute(sql`
        UPDATE posts_rels
        SET categories_id = ${newId}
        WHERE categories_id = ${oldId};
      `)
      updateCount++
    }

    // Verify after update
    const postCategoryRefsAfter = await payload.db.drizzle.execute(sql`
      SELECT DISTINCT categories_id, COUNT(*) as post_count
      FROM posts_rels
      WHERE categories_id IS NOT NULL
      GROUP BY categories_id
      ORDER BY categories_id;
    `)

    return NextResponse.json({
      success: true,
      message: 'Fixed post category references',
      before: postCategoryRefs.rows,
      after: postCategoryRefsAfter.rows,
      categoryMap: Object.fromEntries(categoryMap),
      updatesApplied: updateCount,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}