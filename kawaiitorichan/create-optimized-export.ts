#!/usr/bin/env tsx

import fs from 'fs';
import { Client } from 'pg';

async function createOptimizedExport() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '2801',
    database: 'golfer'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create a more robust SQL export with proper schema setup
    let sqlOutput = `-- Optimized Bird Content Export
-- Schema setup
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Create tables with proper structure
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  slug_lock BOOLEAN DEFAULT true,
  parent_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR,
  url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  excerpt TEXT,
  language VARCHAR,
  hero_image_id INTEGER,
  content JSONB,
  meta_title VARCHAR,
  meta_description VARCHAR,
  _status VARCHAR DEFAULT 'published',
  published_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS posts_rels (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  "order" INTEGER,
  path VARCHAR,
  categories_id INTEGER,
  posts_id INTEGER
);

-- Insert data
`;

    // Get essential data only (first 100 posts to ensure success)
    const posts = await client.query(`
      SELECT id, title, slug, excerpt, language, content, meta_title, meta_description,
             _status, published_at, created_at, updated_at
      FROM posts
      WHERE language = 'ja'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    console.log(`📝 Exporting ${posts.rows.length} posts...`);

    for (const post of posts.rows) {
      const values = [
        post.id,
        `'${post.title.replace(/'/g, "''")}'`,
        `'${post.slug.replace(/'/g, "''")}'`,
        post.excerpt ? `'${post.excerpt.replace(/'/g, "''")}'` : 'NULL',
        `'${post.language}'`,
        typeof post.content === 'object' ? `'${JSON.stringify(post.content).replace(/'/g, "''")}'` : 'NULL',
        post.meta_title ? `'${post.meta_title.replace(/'/g, "''")}'` : 'NULL',
        post.meta_description ? `'${post.meta_description.replace(/'/g, "''")}'` : 'NULL',
        `'${post._status}'`,
        `'${post.published_at.toISOString()}'`,
        `'${post.created_at.toISOString()}'`,
        `'${post.updated_at.toISOString()}'`
      ];

      sqlOutput += `INSERT INTO posts (id, title, slug, excerpt, language, content, meta_title, meta_description, _status, published_at, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }

    // Add categories
    const categories = await client.query('SELECT * FROM categories LIMIT 20');
    console.log(`📂 Exporting ${categories.rows.length} categories...`);

    for (const cat of categories.rows) {
      const values = [
        cat.id,
        `'${cat.title.replace(/'/g, "''")}'`,
        `'${cat.slug.replace(/'/g, "''")}'`,
        cat.description ? `'${cat.description.replace(/'/g, "''")}'` : 'NULL',
        cat.order || 0,
        cat.slug_lock,
        cat.parent_id || 'NULL',
        `'${cat.created_at.toISOString()}'`,
        `'${cat.updated_at.toISOString()}'`
      ];

      sqlOutput += `INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }

    // Add some basic media entries
    const media = await client.query('SELECT * FROM media LIMIT 50');
    console.log(`🖼️ Exporting ${media.rows.length} media items...`);

    for (const item of media.rows) {
      const values = [
        item.id,
        item.filename ? `'${item.filename.replace(/'/g, "''")}'` : 'NULL',
        item.url ? `'${item.url.replace(/'/g, "''")}'` : 'NULL',
        `'${item.created_at.toISOString()}'`,
        `'${item.updated_at.toISOString()}'`
      ];

      sqlOutput += `INSERT INTO media (id, filename, url, created_at, updated_at) VALUES (${values.join(', ')});\n`;
    }

    // Add post-category relationships
    const rels = await client.query(`
      SELECT pr.* FROM posts_rels pr
      JOIN posts p ON p.id = pr.parent_id
      WHERE p.language = 'ja' AND pr.categories_id IS NOT NULL
      LIMIT 100
    `);

    console.log(`🔗 Exporting ${rels.rows.length} relationships...`);

    for (const rel of rels.rows) {
      sqlOutput += `INSERT INTO posts_rels (parent_id, "order", path, categories_id) VALUES (${rel.parent_id}, ${rel.order || 0}, '${rel.path}', ${rel.categories_id});\n`;
    }

    // Write to file
    fs.writeFileSync('optimized-bird-data-100-posts.sql', sqlOutput);
    console.log('✅ Optimized export saved to optimized-bird-data-100-posts.sql');
    console.log(`📊 File size: ${(fs.statSync('optimized-bird-data-100-posts.sql').size / 1024 / 1024).toFixed(2)}MB`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await client.end();
  }
}

createOptimizedExport();