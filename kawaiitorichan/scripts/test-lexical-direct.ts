#!/usr/bin/env node

import { getPayload } from 'payload';
import configPromise from '../src/payload.config';
import { getDatabaseConnection } from './content-db-migration/multi-database-connection';
import { articleToLexical } from './content-db-migration/article-to-lexical';

async function testLexicalDirect() {
  const pool = getDatabaseConnection('content_creation_db');

  try {
    // Get the problematic article
    const query = `
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

    const result = await pool.query(query);
    const article = result.rows[0];

    console.log('📄 Converting article to Lexical...');
    const lexicalContent = await articleToLexical(article);

    console.log('📋 Generated Lexical content:');
    console.log(JSON.stringify(lexicalContent, null, 2));

    // Now try to create a post with this exact content
    console.log('\n📤 Attempting to create post...');

    const payload = await getPayload({ config: configPromise });

    try {
      const created = await payload.create({
        collection: 'posts',
        data: {
          title: article.title,
          content: lexicalContent,
          slug: 'test-direct-' + Date.now(),
          language: 'ja',
          _status: 'draft',
        },
      });

      console.log(`✅ Success! Post created with ID: ${created.id}`);
    } catch (error: any) {
      console.error('❌ Failed to create post:', error?.message || error);

      // If validation error, show details
      if (error?.data?.errors) {
        console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testLexicalDirect();