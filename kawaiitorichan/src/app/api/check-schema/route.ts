import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get categories table schema
    const columns = await payload.db.drizzle.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position;
    `)

    return NextResponse.json({
      success: true,
      tableName: 'categories',
      columns: columns.rows,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}