import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '../../../../../scripts/content-db-migration/multi-database-connection';

export async function POST(request: NextRequest) {
  try {
    const { database, websiteId } = await request.json();

    if (!database || !websiteId) {
      return NextResponse.json(
        { error: 'Database and website ID are required' },
        { status: 400 }
      );
    }

    const pool = getDatabaseConnection(database);

    // Get language distribution for specific website
    const query = `
      SELECT language, COUNT(*) as count
      FROM articles
      WHERE site_id = $1
        AND language IS NOT NULL
        AND language != ''
      GROUP BY language
      ORDER BY count DESC
    `;

    const result = await pool.query(query, [websiteId]);

    const languages = result.rows.map(row => ({
      language: row.language,
      count: parseInt(row.count, 10)
    }));

    return NextResponse.json({
      success: true,
      websiteId,
      languages,
      total: languages.reduce((sum, l) => sum + l.count, 0)
    });
  } catch (error) {
    console.error('Error loading site languages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load site languages',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}