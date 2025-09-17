#!/usr/bin/env tsx

import { Pool } from 'pg';

// Connect to content_creation_db
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'content_creation_db',
  user: 'postgres',
  password: '2801',
});

async function checkDatabase() {
  try {
    // Check articles table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'articles'
      ORDER BY ordinal_position
    `;

    const columnsResult = await pool.query(columnsQuery);
    console.log('\n📊 Articles Table Structure:');
    console.log('================================');
    columnsResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
    });

    // Check data statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_articles,
        COUNT(DISTINCT site_id) as total_sites,
        COUNT(DISTINCT language) as total_languages,
        COUNT(DISTINCT status) as total_statuses
      FROM articles
    `;

    const statsResult = await pool.query(statsQuery);
    console.log('\n📈 Data Statistics:');
    console.log('================================');
    console.log(`Total Articles: ${statsResult.rows[0].total_articles}`);
    console.log(`Total Sites: ${statsResult.rows[0].total_sites}`);
    console.log(`Total Languages: ${statsResult.rows[0].total_languages}`);
    console.log(`Total Statuses: ${statsResult.rows[0].total_statuses}`);

    // Check sites
    const sitesQuery = `
      SELECT DISTINCT site_id, COUNT(*) as article_count
      FROM articles
      GROUP BY site_id
      ORDER BY site_id
    `;

    const sitesResult = await pool.query(sitesQuery);
    console.log('\n🌐 Sites Distribution:');
    console.log('================================');
    sitesResult.rows.forEach(site => {
      console.log(`Site ${site.site_id || 'NULL'}: ${site.article_count} articles`);
    });

    // Check languages
    const languagesQuery = `
      SELECT DISTINCT language, COUNT(*) as article_count
      FROM articles
      WHERE language IS NOT NULL
      GROUP BY language
      ORDER BY language
    `;

    const languagesResult = await pool.query(languagesQuery);
    console.log('\n🗣️ Languages Distribution:');
    console.log('================================');
    languagesResult.rows.forEach(lang => {
      console.log(`${lang.language}: ${lang.article_count} articles`);
    });

    // Sample articles
    const sampleQuery = `
      SELECT id, title, site_id, language, status, created_at
      FROM articles
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const sampleResult = await pool.query(sampleQuery);
    console.log('\n📝 Sample Articles (Latest 5):');
    console.log('================================');
    sampleResult.rows.forEach(article => {
      console.log(`ID: ${article.id}`);
      console.log(`  Title: ${article.title}`);
      console.log(`  Site: ${article.site_id || 'NULL'}`);
      console.log(`  Language: ${article.language || 'NULL'}`);
      console.log(`  Status: ${article.status}`);
      console.log(`  Created: ${new Date(article.created_at).toLocaleDateString()}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();