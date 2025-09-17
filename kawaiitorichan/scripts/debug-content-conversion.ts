#!/usr/bin/env node

import { getDatabaseConnection } from './content-db-migration/multi-database-connection';
import { articleToLexical } from './content-db-migration/article-to-lexical';

async function debugConversion() {
  const pool = getDatabaseConnection('content_creation_db');

  try {
    // Get one article to test conversion
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
    if (result.rows.length === 0) {
      console.log('No articles found');
      return;
    }

    const article = result.rows[0];
    console.log('📄 Article:');
    console.log(`   Title: ${article.title}`);
    console.log(`   Content length: ${article.content?.length || 0} characters`);
    console.log(`   Content preview: ${article.content?.substring(0, 200)}...`);
    console.log('');

    // Try to convert to Lexical
    console.log('🔄 Converting to Lexical...');
    try {
      const lexicalContent = await articleToLexical(article);
      console.log('✅ Conversion successful!');
      console.log('📋 Lexical structure:');
      console.log(JSON.stringify(lexicalContent, null, 2));
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugConversion();