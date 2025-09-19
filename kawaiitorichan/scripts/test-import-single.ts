import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Pool } from 'pg'

async function testImportSingle() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Connect to content database
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'content_creation_db',
      user: 'postgres',
      password: '2801',
    })

    // Fetch one article from site 22
    const result = await pool.query(`
      SELECT
        id,
        site_id,
        title,
        content,
        language,
        category,
        status,
        meta_description,
        primary_keyword,
        url_slug,
        published_at,
        created_at,
        updated_at
      FROM articles
      WHERE site_id = 22
      AND language = 'ja'
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log('No articles found')
      await pool.end()
      process.exit(1)
    }

    const article = result.rows[0]
    console.log('Testing import with article:', {
      id: article.id,
      title: article.title,
      category: article.category,
      language: article.language,
      contentLength: article.content?.length || 0
    })

    // Create simple Lexical content
    const lexicalContent = {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'text',
                format: 0,
                style: '',
                mode: 'normal',
                text: article.content || 'Test content',
                detail: 0,
                version: 1
              }
            ],
            direction: null
          }
        ],
        direction: 'ltr'
      }
    }

    // Find or create category
    let categoryId = null
    const categories = await payload.find({
      collection: 'categories',
      where: {
        slug: { equals: 'pet-birds' },
      },
      limit: 1,
    })

    if (categories.docs.length > 0) {
      categoryId = categories.docs[0].id
      console.log('Found category:', categories.docs[0].title)
    }

    // Prepare post data
    const postData = {
      title: article.title || 'Test Import',
      content: lexicalContent,
      slug: `test-import-${Date.now()}`,
      language: 'ja',
      _status: 'published',
      publishedAt: new Date().toISOString(),
      meta: {
        title: article.title || 'Test Import',
        description: article.meta_description || 'Test description',
      },
      categories: categoryId ? [categoryId] : [],
      contentDbMeta: {
        originalId: String(article.id),
        websiteId: article.site_id,
        language: article.language,
        importedAt: new Date().toISOString(),
      },
    }

    console.log('\nAttempting to create post with data:', {
      title: postData.title,
      slug: postData.slug,
      language: postData.language,
      status: postData._status,
      categoryCount: postData.categories.length
    })

    // Create the post
    const created = await payload.create({
      collection: 'posts',
      data: postData,
    })

    console.log('\n✅ Successfully created post:', {
      id: created.id,
      title: created.title,
      slug: created.slug,
      status: created._status
    })

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error during import:', error)
    if (error instanceof Error && 'data' in error) {
      console.error('Error details:', (error as any).data)
    }
    process.exit(1)
  }
}

testImportSingle()