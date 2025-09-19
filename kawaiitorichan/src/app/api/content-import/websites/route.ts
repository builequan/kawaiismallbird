import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Site configuration mapping
const siteConfig: Record<string, { name: string; description: string }> = {
  '15': { name: 'Mixed Content Site', description: 'English and Japanese content' },
  '17': { name: 'Small Blog', description: 'Minimal content site' },
  '18': { name: 'Main Content Hub', description: 'Primary content site with mixed languages' },
  '19': { name: 'Japanese Blog', description: 'Japanese-focused content' },
  '20': { name: 'Bilingual Site', description: 'Equal EN/JA content' },
  '21': { name: 'Large Content Portal', description: 'High volume mixed language site' },
  '22': { name: 'Golf Content Site', description: 'Golf-focused articles in both languages' },
}

export async function GET(request: NextRequest) {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'content_creation_db',
    user: 'postgres',
    password: '2801',
  })

  try {
    // Get website statistics
    const result = await pool.query(`
      SELECT
        site_id,
        language,
        COUNT(*) as count
      FROM articles
      WHERE site_id IS NOT NULL
      GROUP BY site_id, language
      ORDER BY site_id, language
    `)

    // Process data into website format
    const websiteMap = new Map<string, any>()

    result.rows.forEach(row => {
      const siteId = row.site_id.toString()

      if (!websiteMap.has(siteId)) {
        websiteMap.set(siteId, {
          id: siteId,
          name: siteConfig[siteId]?.name || `Website ${siteId}`,
          description: siteConfig[siteId]?.description || 'Content website',
          articleCount: 0,
          languages: [],
        })
      }

      const website = websiteMap.get(siteId)
      website.articleCount += parseInt(row.count)

      // Normalize language codes
      const langCode = row.language === 'english' ? 'en' : row.language

      // Check if language already exists and combine counts
      const existingLang = website.languages.find((l: any) => l.code === langCode)
      if (existingLang) {
        existingLang.count += parseInt(row.count)
      } else {
        website.languages.push({
          code: langCode,
          count: parseInt(row.count),
        })
      }
    })

    // Convert to array and sort by site ID
    const websites = Array.from(websiteMap.values()).sort((a, b) =>
      parseInt(a.id) - parseInt(b.id)
    )

    return NextResponse.json({
      websites,
      total: websites.length,
    })
  } catch (error) {
    console.error('Error fetching websites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    )
  } finally {
    await pool.end()
  }
}