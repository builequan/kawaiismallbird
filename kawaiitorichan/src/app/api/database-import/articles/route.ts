import { NextRequest, NextResponse } from 'next/server';
import { queryArticles } from '../../../../../scripts/content-db-migration/multi-database-connection';

export async function POST(request: NextRequest) {
  try {
    const { database, websiteId, language, filters } = await request.json();

    if (!database) {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    const articles = await queryArticles({
      profileName: database,
      websiteId: websiteId || undefined,
      language: language || undefined,
      searchText: filters?.search,
      categories: filters?.category ? [filters.category] : undefined,
      authors: filters?.author ? [filters.author] : undefined,
      status: filters?.status ? [filters.status] : undefined,
      hasImages: filters?.hasImages,
      limit: 100, // Default limit
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Failed to load articles:', error);
    return NextResponse.json(
      { error: 'Failed to load articles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}