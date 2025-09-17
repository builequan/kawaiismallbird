import { getPayload } from 'payload';
import configPromise from '../../src/payload.config';
import { GenericArticle as ContentArticle } from './multi-database-connection';
import { articleToLexical, applyLanguageFormatting } from './article-to-lexical';
import slugify from 'slugify';

// Migration configuration
export interface MigrationConfig {
  websiteId: number;
  language: string;
  categoryMapping?: Record<string, string>; // Map content DB categories to Payload categories
  authorMapping?: Record<string, string>; // Map content DB authors to Payload users
  statusMapping?: Record<string, 'draft' | 'published'>; // Map content DB status to Payload status
  collectionName?: string; // Target Payload collection (default: 'posts')
  batchSize?: number; // Number of articles to process at once
}

// Upload result tracking
export interface UploadResult {
  success: boolean;
  articleId: number;
  payloadId?: string;
  title: string;
  error?: string;
}

// Main upload function
export async function uploadToPayload(
  articles: ContentArticle[],
  config: MigrationConfig,
  onProgress?: (current: number, total: number, result?: UploadResult) => void
): Promise<UploadResult[]> {
  const payload = await getPayload({ config: configPromise });
  const results: UploadResult[] = [];
  const collectionName = config.collectionName || 'posts';

  // Process in batches to avoid overwhelming the system
  const batchSize = config.batchSize || 10;
  const batches = [];
  for (let i = 0; i < articles.length; i += batchSize) {
    batches.push(articles.slice(i, i + batchSize));
  }

  let processedCount = 0;

  for (const batch of batches) {
    const batchPromises = batch.map(async (article) => {
      try {
        // Convert article to Lexical format
        const lexicalContent = await articleToLexical(article);
        const formattedContent = applyLanguageFormatting(lexicalContent, config.language);

        // Prepare Payload document
        const payloadDoc = await preparePayloadDocument(article, formattedContent, config, payload);

        // Check if article already exists (by slug or original ID)
        const existingDoc = await findExistingDocument(payload, collectionName, article, config);

        let result: UploadResult;

        if (existingDoc) {
          // Update existing document
          const updated = await payload.update({
            collection: collectionName,
            id: existingDoc.id,
            data: payloadDoc,
          });

          result = {
            success: true,
            articleId: article.id,
            payloadId: updated.id,
            title: article.title,
          };
        } else {
          // Create new document
          const created = await payload.create({
            collection: collectionName,
            data: payloadDoc,
          });

          result = {
            success: true,
            articleId: article.id,
            payloadId: created.id,
            title: article.title,
          };
        }

        processedCount++;
        if (onProgress) {
          onProgress(processedCount, articles.length, result);
        }

        return result;
      } catch (error) {
        const errorResult: UploadResult = {
          success: false,
          articleId: article.id,
          title: article.title,
          error: error instanceof Error ? error.message : String(error),
        };

        processedCount++;
        if (onProgress) {
          onProgress(processedCount, articles.length, errorResult);
        }

        return errorResult;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

// Prepare document for Payload
async function preparePayloadDocument(
  article: ContentArticle,
  lexicalContent: any,
  config: MigrationConfig,
  payload: any
): Promise<any> {
  // Create excerpt in Lexical format if we have meta_description
  let excerptContent = null;
  if (article.meta_description) {
    excerptContent = {
      root: {
        type: 'root',
        version: 1,
        children: [{
          type: 'paragraph',
          version: 1,
          children: [{
            type: 'text',
            version: 1,
            text: article.meta_description,
            format: 0,
            detail: 0,
            mode: 'normal',
          }],
          format: 0,
          indent: 0,
          direction: null,
        }],
        format: 0,
        indent: 0,
        direction: null,
      }
    };
  }

  const doc: any = {
    title: article.title,
    content: lexicalContent,
    slug: article.slug || slugify(article.title, { lower: true, strict: true }),
    language: config.language === 'japanese' ? 'ja' : config.language === 'english' ? 'en' : config.language,
    excerpt: excerptContent,
    meta: {
      title: article.title,
      description: article.meta_description || '',
      keywords: article.keywords || '',
    },
    publishedAt: article.published_at || article.created_at,
    _status: mapStatus(article.status, config.statusMapping),
  };

  // Map category if provided
  if (article.category && config.categoryMapping) {
    const mappedCategory = config.categoryMapping[article.category];
    if (mappedCategory) {
      // Find category ID in Payload
      const category = await payload.find({
        collection: 'categories',
        where: {
          slug: { equals: mappedCategory },
        },
        limit: 1,
      });

      if (category.docs.length > 0) {
        doc.categories = [category.docs[0].id];
      }
    }
  }

  // Map author if provided
  if (article.author && config.authorMapping) {
    const mappedAuthor = config.authorMapping[article.author];
    if (mappedAuthor) {
      // Find user ID in Payload
      const user = await payload.find({
        collection: 'users',
        where: {
          email: { equals: mappedAuthor },
        },
        limit: 1,
      });

      if (user.docs.length > 0) {
        doc.author = user.docs[0].id;
      }
    }
  }

  // Add tags if available
  if (article.tags && Array.isArray(article.tags)) {
    const tagIds = [];
    for (const tagName of article.tags) {
      // Find or create tag
      let tag = await payload.find({
        collection: 'tags',
        where: {
          name: { equals: tagName },
        },
        limit: 1,
      });

      if (tag.docs.length === 0) {
        // Create new tag
        tag = await payload.create({
          collection: 'tags',
          data: {
            name: tagName,
            slug: slugify(tagName, { lower: true, strict: true }),
          },
        });
        tagIds.push(tag.id);
      } else {
        tagIds.push(tag.docs[0].id);
      }
    }
    doc.tags = tagIds;
  }

  // Store original article metadata for reference
  doc.wordpressMetadata = {
    originalAuthor: article.author || '',
    originalDate: article.created_at,
    modifiedDate: article.updated_at || article.created_at,
    status: mapStatus(article.status, config.statusMapping),
    enableComments: true,
    enableToc: true,
  };

  // Store content database tracking info separately
  doc.contentDbMeta = {
    originalId: `contentdb_${config.websiteId}_${article.id}`,
    websiteId: config.websiteId,
    language: config.language,
    importedAt: new Date(),
  };

  return doc;
}

// Find existing document in Payload
async function findExistingDocument(
  payload: any,
  collectionName: string,
  article: ContentArticle,
  config: MigrationConfig
): Promise<any> {
  // First try to find by content database meta original ID
  const byMetaId = await payload.find({
    collection: collectionName,
    where: {
      'contentDbMeta.originalId': {
        equals: `contentdb_${config.websiteId}_${article.id}`,
      },
    },
    limit: 1,
  });

  if (byMetaId.docs.length > 0) {
    return byMetaId.docs[0];
  }

  // Then try by slug
  if (article.slug) {
    const bySlug = await payload.find({
      collection: collectionName,
      where: {
        slug: { equals: article.slug },
      },
      limit: 1,
    });

    if (bySlug.docs.length > 0) {
      return bySlug.docs[0];
    }
  }

  return null;
}

// Map status from content DB to Payload
function mapStatus(
  status?: string,
  mapping?: Record<string, 'draft' | 'published'>
): 'draft' | 'published' {
  if (!status) return 'draft';
  if (mapping && mapping[status]) return mapping[status];

  // Default mapping
  if (status === 'published' || status === 'publish') return 'published';
  return 'draft';
}

// Batch upload with detailed configuration
export async function batchUpload(
  articles: ContentArticle[],
  config: MigrationConfig
): Promise<{
  successful: UploadResult[];
  failed: UploadResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
  };
}> {
  const startTime = Date.now();

  console.log(`\n📦 Starting batch upload of ${articles.length} articles...`);
  console.log(`   Website ID: ${config.websiteId}`);
  console.log(`   Language: ${config.language}`);
  console.log(`   Target Collection: ${config.collectionName || 'posts'}\n`);

  const results = await uploadToPayload(articles, config, (current, total, result) => {
    if (result) {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} [${current}/${total}] ${result.title}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const duration = (Date.now() - startTime) / 1000;

  console.log('\n📊 Upload Summary:');
  console.log(`   Total: ${articles.length}`);
  console.log(`   Succeeded: ${successful.length}`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);

  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(f => {
      console.log(`   - ${f.title}: ${f.error}`);
    });
  }

  return {
    successful,
    failed,
    summary: {
      total: articles.length,
      succeeded: successful.length,
      failed: failed.length,
      duration,
    },
  };
}