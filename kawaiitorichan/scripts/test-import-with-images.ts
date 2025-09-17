#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';
import { getDatabaseConnection } from './content-db-migration/multi-database-connection';
import { articleToLexical } from './content-db-migration/article-to-lexical';
import { cleanupTempImages } from './content-db-migration/image-handler';

async function testImportWithImages() {
  console.log('🧪 Testing import with image upload...\n');

  try {
    const pool = getDatabaseConnection('content_creation_db');

    // Get an article that hasn't been imported yet
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
        AND id NOT IN (1818, 1819) -- Skip already imported ones
      LIMIT 1
    `;

    const result = await pool.query(testQuery);

    if (result.rows.length === 0) {
      console.log('❌ No articles found for testing');
      return;
    }

    const article = result.rows[0];
    console.log('📄 Test article:');
    console.log(`   Title: ${article.title}`);
    console.log(`   Content preview: ${article.content.substring(0, 200)}...`);

    // Check if it has images
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    while ((match = imagePattern.exec(article.content)) !== null) {
      images.push({ alt: match[1], url: match[2] });
    }

    console.log(`   Found ${images.length} images in content\n`);

    if (images.length > 0) {
      console.log('📸 Images to upload:');
      images.forEach((img, i) => {
        console.log(`   ${i + 1}. ${img.url.substring(0, 60)}...`);
      });
      console.log('');
    }

    // Convert to Lexical WITH image upload
    console.log('🔄 Converting to Lexical with image upload...');
    const lexicalContent = await articleToLexical(article, { uploadImages: true });

    // Create the post
    const payload = await getPayload({ config: configPromise });

    const postData = {
      title: article.title,
      content: lexicalContent,
      slug: 'test-images-' + Date.now(),
      language: 'ja',
      _status: 'draft' as const,
      contentDbMeta: {
        originalId: `contentdb_19_${article.id}`,
        websiteId: 19,
        language: 'ja',
        importedAt: new Date(),
      },
    };

    console.log('📤 Creating post...');
    const created = await payload.create({
      collection: 'posts',
      data: postData,
    });

    console.log(`✅ Success! Post created with ID: ${created.id}`);

    // Check if images were uploaded
    let uploadCount = 0;
    function countUploads(node: any) {
      if (node.type === 'upload') {
        uploadCount++;
      }
      if (node.children) {
        node.children.forEach(countUploads);
      }
    }
    countUploads(created.content.root);

    console.log(`📸 ${uploadCount} images were uploaded as media items`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } finally {
    cleanupTempImages();
    process.exit(0);
  }
}

testImportWithImages().catch(console.error);