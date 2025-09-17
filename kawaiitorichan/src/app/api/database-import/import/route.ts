import { NextRequest, NextResponse } from 'next/server';
import { queryArticles, type GenericArticle } from '../../../../../scripts/content-db-migration/multi-database-connection';
import { batchUpload, type MigrationConfig } from '../../../../../scripts/content-db-migration/upload-to-payload';

export async function POST(request: NextRequest) {
  try {
    const { database, websiteId, language, articleIds } = await request.json();

    if (!database || !articleIds || articleIds.length === 0) {
      return NextResponse.json(
        { error: 'Database and article IDs are required' },
        { status: 400 }
      );
    }

    // Fetch the selected articles
    const allArticles = await queryArticles({
      profileName: database,
      websiteId: websiteId || undefined,
      language: language || undefined,
    });

    // Filter to only selected articles
    const selectedArticles = allArticles.filter(article =>
      articleIds.includes(article.id)
    );

    if (selectedArticles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found with the provided IDs' },
        { status: 404 }
      );
    }

    // Prepare migration config
    const config: MigrationConfig = {
      websiteId: Number(websiteId) || 1,
      language: language || 'en',
      batchSize: 10,
      collectionName: 'posts',
    };

    // Perform the import
    const results = await batchUpload(selectedArticles as any, config);

    return NextResponse.json({
      success: true,
      results: {
        total: results.summary.total,
        succeeded: results.summary.succeeded,
        failed: results.summary.failed,
        duration: results.summary.duration,
        successful: results.successful,
        failedItems: results.failed,
      },
    });
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}