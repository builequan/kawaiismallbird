#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';

async function testMinimalImport() {
  console.log('🧪 Testing minimal import...\n');

  try {
    const payload = await getPayload({ config: configPromise });

    // Create minimal Lexical content
    const minimalContent = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'This is a test article from the content database.',
                format: 0,
                detail: 0,
                mode: 'normal',
              }
            ],
            format: 0,
            indent: 0,
            direction: null,
          }
        ],
        format: 0,
        indent: 0,
        direction: null,
      }
    };

    // Create minimal post data
    const postData = {
      title: 'Test Import Article',
      content: minimalContent,
      slug: 'test-import-article-' + Date.now(),
      language: 'ja',
      _status: 'draft' as const,
      contentDbMeta: {
        originalId: 'contentdb_19_test',
        websiteId: 19,
        language: 'ja',
        importedAt: new Date(),
      },
    };

    console.log('📤 Creating post with minimal data...');
    console.log('Post data:', JSON.stringify(postData, null, 2));

    const created = await payload.create({
      collection: 'posts',
      data: postData,
    });

    console.log(`✅ Success! Post created with ID: ${created.id}`);
    console.log(`   Title: ${created.title}`);
    console.log(`   Slug: ${created.slug}`);

  } catch (error) {
    console.error('❌ Failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

testMinimalImport().catch(console.error);