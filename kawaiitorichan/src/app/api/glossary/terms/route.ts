import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const grouped = searchParams.get('grouped') === 'true'

    // If postId is provided, get terms for that post
    if (postId) {
      // Use direct SQL query for relationship lookup since Payload's relationship query
      // doesn't work well with hasMany relationships stored in _rels table
      const { Pool } = await import('pg')
      const pool = new Pool({
        connectionString: process.env.DATABASE_URI,
      })

      try {
        // Get glossary IDs that are linked to this post
        const result = await pool.query(
          `SELECT g.id, g.term, g.reading, g.definition, g.source, g.wikipedia_url, g.category
           FROM glossary g
           INNER JOIN glossary_rels gr ON gr.parent_id = g.id
           WHERE gr.posts_id = $1 AND gr.path = 'posts'
           ORDER BY g.reading`,
          [Number(postId)]
        )

        await pool.end()

        return NextResponse.json({
          terms: result.rows.map(row => ({
            id: row.id,
            term: row.term,
            reading: row.reading,
            definition: row.definition,
            source: row.source,
            wikipediaUrl: row.wikipedia_url,
            category: row.category,
          })),
        })
      } catch (dbError) {
        await pool.end()
        throw dbError
      }
    }

    // Get all terms
    const glossary = await payload.find({
      collection: 'glossary',
      limit: 10000,
      pagination: false,
      sort: 'reading',
    })

    // If grouped, organize by first character
    if (grouped) {
      const groups: Record<string, Array<any>> = {
        'あ': [], 'か': [], 'さ': [], 'た': [], 'な': [],
        'は': [], 'ま': [], 'や': [], 'ら': [], 'わ': [],
        'その他': [],
      }

      for (const entry of glossary.docs) {
        const reading = entry.reading || ''
        const firstChar = reading.charAt(0)

        let group = 'その他'

        if (firstChar >= 'あ' && firstChar <= 'お') group = 'あ'
        else if (firstChar >= 'か' && firstChar <= 'こ' || 'がぎぐげご'.includes(firstChar)) group = 'か'
        else if (firstChar >= 'さ' && firstChar <= 'そ' || 'ざじずぜぞ'.includes(firstChar)) group = 'さ'
        else if (firstChar >= 'た' && firstChar <= 'と' || 'だぢづでど'.includes(firstChar)) group = 'た'
        else if (firstChar >= 'な' && firstChar <= 'の') group = 'な'
        else if (firstChar >= 'は' && firstChar <= 'ほ' || 'ばびぶべぼぱぴぷぺぽ'.includes(firstChar)) group = 'は'
        else if (firstChar >= 'ま' && firstChar <= 'も') group = 'ま'
        else if ('やゆよ'.includes(firstChar)) group = 'や'
        else if (firstChar >= 'ら' && firstChar <= 'ろ') group = 'ら'
        else if ('わをん'.includes(firstChar)) group = 'わ'

        groups[group].push({
          id: entry.id,
          term: entry.term,
          reading: entry.reading,
          definition: entry.definition,
          source: entry.source,
          wikipediaUrl: entry.wikipediaUrl,
          category: entry.category,
        })
      }

      return NextResponse.json({ groups })
    }

    // Return flat list
    return NextResponse.json({
      terms: glossary.docs.map(entry => ({
        id: entry.id,
        term: entry.term,
        reading: entry.reading,
        definition: entry.definition,
        source: entry.source,
        wikipediaUrl: entry.wikipediaUrl,
        category: entry.category,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching glossary terms:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch terms',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
