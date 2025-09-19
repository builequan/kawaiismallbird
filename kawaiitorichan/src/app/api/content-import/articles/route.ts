import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const websiteId = searchParams.get('websiteId')
  const language = searchParams.get('language')
  const search = searchParams.get('search')
  const limit = searchParams.get('limit') || '500'

  if (!websiteId) {
    return NextResponse.json(
      { error: 'Website ID is required' },
      { status: 400 }
    )
  }

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'content_creation_db',
    user: 'postgres',
    password: '2801',
  })

  try {
    let query = `
      SELECT
        id,
        title,
        language,
        category,
        status,
        published_at,
        LENGTH(content) as word_count
      FROM articles
      WHERE site_id = $1
    `

    const params: any[] = [websiteId]
    let paramCount = 1

    // Add language filter
    if (language) {
      paramCount++
      // Handle both 'en' and 'english' as English
      if (language === 'en') {
        query += ` AND (language = $${paramCount} OR language = 'english')`
        params.push('en')
      } else {
        query += ` AND language = $${paramCount}`
        params.push(language)
      }
    }

    // Add search filter
    if (search) {
      paramCount++
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    // Add ordering and limit
    query += ` ORDER BY published_at DESC NULLS LAST, created_at DESC`
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)

    const result = await pool.query(query, params)

    // Format articles
    const articles = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      language: row.language === 'english' ? 'en' : row.language,
      category: row.category || 'uncategorized',
      status: row.status || 'draft',
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
      wordCount: Math.round(row.word_count / 5), // Rough estimate
      selected: false,
    }))

    return NextResponse.json({
      articles,
      total: articles.length,
      websiteId,
      language: language || 'all',
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  } finally {
    await pool.end()
  }
}