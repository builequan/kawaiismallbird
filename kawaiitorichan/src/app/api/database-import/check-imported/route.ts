import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@/payload.config';

// Check import status of articles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleIds, websiteId } = body;

    if (!articleIds || !Array.isArray(articleIds) || !websiteId) {
      return NextResponse.json(
        { error: 'articleIds array and websiteId are required' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config: configPromise });

    // Check each article's import status
    const importStatuses = await Promise.all(
      articleIds.map(async (articleId) => {
        const originalId = `contentdb_${websiteId}_${articleId}`;

        try {
          // Check if article exists in Payload
          const existing = await payload.find({
            collection: 'posts',
            where: {
              'contentDbMeta.originalId': {
                equals: originalId,
              },
            },
            limit: 1,
            depth: 0,
          });

          if (existing.docs.length > 0) {
            const doc = existing.docs[0];
            // Check if the article has been updated since import
            const importedAt = doc.contentDbMeta?.importedAt;
            const updatedAt = doc.updatedAt;

            return {
              articleId,
              status: 'imported',
              payloadId: doc.id,
              importedAt,
              hasUpdates: importedAt && updatedAt && new Date(updatedAt) > new Date(importedAt),
            };
          }

          // Also check by slug as a fallback
          const slug = await checkBySlug(payload, articleId, websiteId);
          if (slug) {
            return {
              articleId,
              status: 'imported',
              payloadId: slug.id,
              importedAt: slug.contentDbMeta?.importedAt,
              hasUpdates: false,
            };
          }

          return {
            articleId,
            status: 'new',
            payloadId: null,
            importedAt: null,
            hasUpdates: false,
          };
        } catch (error) {
          console.error(`Error checking article ${articleId}:`, error);
          return {
            articleId,
            status: 'error',
            payloadId: null,
            importedAt: null,
            hasUpdates: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // Aggregate statistics
    const stats = {
      total: importStatuses.length,
      imported: importStatuses.filter(s => s.status === 'imported').length,
      new: importStatuses.filter(s => s.status === 'new').length,
      updated: importStatuses.filter(s => s.hasUpdates).length,
      errors: importStatuses.filter(s => s.status === 'error').length,
    };

    return NextResponse.json({
      success: true,
      statuses: importStatuses,
      stats,
    });
  } catch (error) {
    console.error('Error checking import status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check import status'
      },
      { status: 500 }
    );
  }
}

// Helper function to check by slug
async function checkBySlug(payload: any, articleId: number, websiteId: number) {
  // This would require knowing the slug from the source database
  // For now, we'll skip this check but it could be implemented
  // if we pass the slug from the frontend
  return null;
}