#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function importProductionData() {
  console.log('📥 Starting production data import...');

  // Parse DATABASE_URI environment variable
  const DATABASE_URI = process.env.DATABASE_URI;
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI environment variable not set');
    process.exit(1);
  }

  // Parse PostgreSQL connection string
  const match = DATABASE_URI.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ Invalid DATABASE_URI format');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  // Create PostgreSQL connection pool
  const pool = new Pool({
    user,
    password,
    host,
    port: parseInt(port),
    database,
  });

  try {
    // Check if data file exists
    const dataPath = path.join(__dirname, 'production_data.json');

    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ No production_data.json found. Skipping import.');
      await pool.end();
      return;
    }

    const dataContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(dataContent);

    console.log(`📊 Found data from ${data.metadata.exportedAt}`);
    console.log('🔄 Starting SQL-based import...');

    // Import categories first
    if (data.collections.categories?.length > 0) {
      console.log(`\n📁 Importing ${data.collections.categories.length} categories...`);

      for (const category of data.collections.categories) {
        try {
          await pool.query(
            `INSERT INTO categories (title, slug, "createdAt", "updatedAt")
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (slug) DO NOTHING`,
            [category.title, category.slug]
          );
          console.log(`   ✅ Imported category: ${category.title}`);
        } catch (error) {
          console.error(`   ❌ Failed to import category ${category.title}:`, error.message);
        }
      }
    }

    // Import posts with their content
    if (data.collections.posts?.length > 0) {
      console.log(`\n📝 Importing ${data.collections.posts.length} posts...`);

      for (const post of data.collections.posts) {
        try {
          // Insert post
          const result = await pool.query(
            `INSERT INTO posts (title, slug, content, "publishedAt", "createdAt", "updatedAt", status, "wpPostId")
             VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
             ON CONFLICT (slug) DO UPDATE
             SET content = EXCLUDED.content,
                 title = EXCLUDED.title,
                 "updatedAt" = NOW()
             RETURNING id`,
            [
              post.title,
              post.slug,
              JSON.stringify(post.content),
              post.publishedAt || new Date().toISOString(),
              post.status || 'published',
              post.wpPostId || null
            ]
          );

          const postId = result.rows[0].id;

          // Link post to categories
          if (post.categories && Array.isArray(post.categories)) {
            for (const category of post.categories) {
              const categorySlug = typeof category === 'object' ? category.slug : category;

              // Get category ID
              const catResult = await pool.query(
                'SELECT id FROM categories WHERE slug = $1',
                [categorySlug]
              );

              if (catResult.rows.length > 0) {
                await pool.query(
                  `INSERT INTO posts_rels (parent_id, path, category_id)
                   VALUES ($1, 'categories', $2)
                   ON CONFLICT DO NOTHING`,
                  [postId, catResult.rows[0].id]
                );
              }
            }
          }

          console.log(`   ✅ Imported post: ${post.title}`);
        } catch (error) {
          console.error(`   ❌ Failed to import post ${post.title}:`, error.message);
        }
      }
    }

    // Import pages
    if (data.collections.pages?.length > 0) {
      console.log(`\n📄 Importing ${data.collections.pages.length} pages...`);

      for (const page of data.collections.pages) {
        try {
          await pool.query(
            `INSERT INTO pages (title, slug, "createdAt", "updatedAt", "publishedAt", status)
             VALUES ($1, $2, NOW(), NOW(), NOW(), 'published')
             ON CONFLICT (slug) DO UPDATE
             SET title = EXCLUDED.title,
                 "updatedAt" = NOW()`,
            [page.title, page.slug]
          );
          console.log(`   ✅ Imported page: ${page.title}`);
        } catch (error) {
          console.error(`   ❌ Failed to import page ${page.title}:`, error.message);
        }
      }
    }

    // Verify import
    const postCount = await pool.query('SELECT COUNT(*) FROM posts');
    const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');

    console.log('\n✅ Import completed!');
    console.log(`   - Posts: ${postCount.rows[0].count}`);
    console.log(`   - Categories: ${categoryCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importProductionData();