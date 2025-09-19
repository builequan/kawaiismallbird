import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
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
      // Fetch full article details
      const result = await pool.query(
        `SELECT
          id,
          title,
          content,
          language,
          category,
          status,
          meta_description,
          primary_keyword as keywords,
          published_at,
          created_at,
          updated_at,
          featured_image_url
        FROM articles
        WHERE id = $1`,
        [articleId]
      )

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }

      const article = result.rows[0]

      // Get a preview of the content (first 500 characters)
      const contentPreview = article.content
        ? article.content.substring(0, 500) + (article.content.length > 500 ? '...' : '')
        : ''

      return NextResponse.json({
        id: article.id,
        title: article.title || 'Untitled',
        contentPreview,
        language: article.language === 'english' ? 'en' : article.language,
        category: article.category || 'uncategorized',
        status: article.status || 'draft',
        metaDescription: article.meta_description,
        keywords: article.keywords,
        author: 'Unknown',
        featuredImage: article.featured_image_url,
        publishedAt: article.published_at
          ? new Date(article.published_at).toISOString()
          : null,
        createdAt: new Date(article.created_at).toISOString(),
        updatedAt: new Date(article.updated_at).toISOString(),
        wordCount: article.content ? Math.round(article.content.length / 5) : 0,
      })
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('Error previewing article:', error)
    return NextResponse.json(
      { error: 'Failed to preview article' },
      { status: 500 }
    )
  }
}