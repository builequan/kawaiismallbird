import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get unique category IDs from posts_rels table
    const postCategoryIds = await payload.db.drizzle.execute(sql`
      SELECT DISTINCT categories_id, COUNT(*) as post_count
      FROM posts_rels
      WHERE categories_id IS NOT NULL
      GROUP BY categories_id
      ORDER BY post_count DESC;
    `)

    // Get existing categories
    const existingCategories = await payload.db.drizzle.execute(sql`
      SELECT id, title, slug FROM categories ORDER BY id;
    `)

    return NextResponse.json({
      success: true,
      message: 'Post category analysis',
      postCategoryIds: postCategoryIds.rows,
      existingCategories: existingCategories.rows,
      summary: {
        uniqueCategoryIdsInPosts: postCategoryIds.rows.length,
        existingCategoriesInDB: existingCategories.rows.length,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}