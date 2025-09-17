#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';
import { getDatabaseConnection, GenericArticle } from './content-db-migration/multi-database-connection';
import { uploadToPayload, MigrationConfig } from './content-db-migration/upload-to-payload';

async function testImport() {
  console.log('🧪 Testing content database import...\n');

  try {
    // Connect to content database
    const pool = getDatabaseConnection('content_creation_db');

    // Get one article from website 19 for testing
    const testQuery = `
      SELECT
        id,
        title,
        content,
        url_slug as slug,
        meta_description,
        primary_keyword as keywords,
        created_at,
        updated_at,
        status,
        featured_image_url,
        category as author,
        language,
        site_id
      FROM articles
      WHERE site_id = 19
        AND language = 'ja'
      LIMIT 1
    `;

    const result = await pool.query(testQuery);

    if (result.rows.length === 0) {
      console.log('❌ No articles found for testing');
      return;
    }

    const article = result.rows[0] as GenericArticle;
    console.log('📄 Test article:');
    console.log(`   Title: ${article.title}`);
    console.log(`   Language: ${article.language}`);
    console.log(`   Site ID: ${article.site_id}\n`);

    // Prepare migration config
    const config: MigrationConfig = {
      websiteId: 19,
      language: 'ja',
      collectionName: 'posts',
      batchSize: 1,
    };

    // Test the upload
    console.log('📤 Attempting to upload to Payload...');
    const results = await uploadToPayload([article], config);

    const result0 = results[0];
    if (result0.success) {
      console.log(`✅ Success! Post created with ID: ${result0.payloadId}`);

      // Verify the post was actually created
      const payload = await getPayload({ config: configPromise });
      const post = await payload.findByID({
        collection: 'posts',
        id: result0.payloadId!,
      });

      console.log('\n📋 Verification:');
      console.log(`   Title: ${post.title}`);
      console.log(`   Language: ${post.language}`);
      console.log(`   Content DB Meta: ${JSON.stringify(post.contentDbMeta, null, 2)}`);
    } else {
      console.log(`❌ Failed: ${result0.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

// Run the test
testImport().catch(console.error);