#!/usr/bin/env tsx

// Direct import script for Website ID 20 articles
import { contentDb } from './scripts/content-db-migration/database-connection';
import { batchUpload, type MigrationConfig } from './scripts/content-db-migration/upload-to-payload';

async function importWebsite20() {
  console.log('🚀 Starting import of Website ID 20 articles...');

  try {
    // Get articles from Website ID 20
    console.log('📊 Fetching articles from Website ID 20...');
    const articles = await contentDb.query(`
      SELECT * FROM articles
      WHERE website_id = 20
      AND language = 'ja'
      ORDER BY created_at DESC
    `);

    console.log(`✅ Found ${articles.length} Japanese articles from Website ID 20`);

    if (articles.length === 0) {
      console.log('❌ No articles found for Website ID 20');
      return;
    }

    // Configuration for the upload
    const config: MigrationConfig = {
      websiteId: 20,
      language: 'ja',
      batchSize: 10,
      parallel: 3,
      retryAttempts: 3,
      verbose: true
    };

    // Upload to Payload
    console.log('📤 Starting upload to Payload CMS...');
    const result = await batchUpload(articles, config);

    console.log('✅ Import completed!');
    console.log(`📊 Imported: ${result.successful} articles`);
    console.log(`❌ Failed: ${result.failed} articles`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await contentDb.end();
    process.exit(0);
  }
}

// Run the import
importWebsite20();