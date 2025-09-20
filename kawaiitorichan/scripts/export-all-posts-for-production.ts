import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { promises as fs } from 'fs'
import path from 'path'

async function exportAllPosts() {
  const payload = await getPayload({ config: configPromise })

  try {
    console.log('📚 Exporting all posts from local database...')

    // Get all posts with categories and media
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 2,
      where: {
        _status: {
          equals: 'published'
        }
      }
    })

    // Get all categories
    const categories = await payload.find({
      collection: 'categories',
      limit: 100
    })

    // Get all media
    const media = await payload.find({
      collection: 'media',
      limit: 1000
    })

    console.log(`✅ Found ${posts.docs.length} posts`)
    console.log(`📁 Found ${categories.docs.length} categories`)
    console.log(`🖼️ Found ${media.docs.length} media items`)

    // Create SQL file with all data
    let sql = `-- Production data import with all posts from local database
-- Generated on ${new Date().toISOString()}

-- Drop and recreate tables with all data
DROP TABLE IF EXISTS posts_internal_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS posts_affiliate_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS posts_populated_authors CASCADE;
DROP TABLE IF EXISTS posts_rels CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories_breadcrumbs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS header CASCADE;
DROP TABLE IF EXISTS footer CASCADE;

-- Create users table
CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create categories table with all fields
CREATE TABLE categories (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  description text,
  "order" integer DEFAULT 0,
  slug_lock boolean DEFAULT true,
  parent_id integer,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create categories breadcrumbs table
CREATE TABLE categories_breadcrumbs (
  id serial PRIMARY KEY,
  _parent_id integer REFERENCES categories(id) ON DELETE CASCADE,
  _order integer,
  doc_id integer,
  url varchar,
  label varchar
);

-- Create tags table
CREATE TABLE tags (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create media table
CREATE TABLE media (
  id serial PRIMARY KEY,
  filename varchar,
  url varchar,
  alt text,
  width integer,
  height integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create complete posts table with ALL fields
CREATE TABLE posts (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  excerpt text,
  language varchar,
  hero_image_id integer,
  hero_image_alt varchar,
  content jsonb,
  meta_title varchar,
  meta_image_id integer,
  meta_description varchar,
  meta_keywords varchar,
  meta_focus_keyphrase varchar,
  wordpress_metadata_original_author varchar,
  wordpress_metadata_original_date timestamp,
  wordpress_metadata_modified_date timestamp,
  wordpress_metadata_status varchar,
  wordpress_metadata_enable_comments boolean DEFAULT false,
  wordpress_metadata_enable_toc boolean DEFAULT false,
  internal_links_metadata_version integer DEFAULT 0,
  internal_links_metadata_last_processed timestamp,
  internal_links_metadata_content_hash varchar,
  content_db_meta_original_id integer,
  content_db_meta_website_id integer,
  content_db_meta_language varchar,
  content_db_meta_imported_at timestamp,
  affiliate_links_metadata_version integer DEFAULT 0,
  affiliate_links_metadata_last_processed timestamp,
  affiliate_links_metadata_link_count integer DEFAULT 0,
  affiliate_links_metadata_content_hash varchar,
  affiliate_links_metadata_exclude_from_affiliates boolean DEFAULT false,
  slug_lock boolean DEFAULT true,
  _status varchar DEFAULT 'published',
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create related tables
CREATE TABLE posts_internal_links_metadata_links_added (
  id serial PRIMARY KEY,
  _parent_id integer REFERENCES posts(id) ON DELETE CASCADE,
  _order integer,
  target_slug varchar,
  anchor_text varchar,
  position integer
);

CREATE TABLE posts_affiliate_links_metadata_links_added (
  id serial PRIMARY KEY,
  _parent_id integer REFERENCES posts(id) ON DELETE CASCADE,
  _order integer,
  product_id integer,
  product_name varchar,
  anchor_text varchar,
  position integer,
  type varchar
);

CREATE TABLE posts_populated_authors (
  id serial PRIMARY KEY,
  _parent_id integer REFERENCES posts(id) ON DELETE CASCADE,
  _order integer,
  name varchar
);

CREATE TABLE posts_rels (
  id serial PRIMARY KEY,
  parent_id integer REFERENCES posts(id) ON DELETE CASCADE,
  "order" integer,
  path varchar,
  categories_id integer,
  tags_id integer,
  posts_id integer,
  users_id integer
);

CREATE TABLE header (
  id serial PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE footer (
  id serial PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Insert data
INSERT INTO users (email) VALUES ('admin@example.com');

`

    // Add categories
    if (categories.docs.length > 0) {
      sql += '-- Insert categories\n'
      sql += 'INSERT INTO categories (id, title, slug, description, "order", parent_id) VALUES\n'

      const categoryValues = categories.docs.map((cat, idx) => {
        const desc = cat.description ? `'${cat.description.replace(/'/g, "''")}'` : 'NULL'
        const order = cat.order || idx + 1
        const parentId = cat.parent ? cat.parent : 'NULL'
        return `  (${cat.id}, '${cat.title.replace(/'/g, "''")}', '${cat.slug}', ${desc}, ${order}, ${parentId})`
      })

      sql += categoryValues.join(',\n') + ';\n\n'
    }

    // Add media
    if (media.docs.length > 0) {
      sql += '-- Insert media\n'
      sql += 'INSERT INTO media (id, filename, url, alt, width, height) VALUES\n'

      const mediaValues = media.docs.map(m => {
        const filename = m.filename ? `'${m.filename.replace(/'/g, "''")}'` : 'NULL'
        const url = m.url ? `'${m.url.replace(/'/g, "''")}'` : 'NULL'
        const alt = m.alt ? `'${m.alt.replace(/'/g, "''")}'` : 'NULL'
        const width = m.width || 'NULL'
        const height = m.height || 'NULL'
        return `  (${m.id}, ${filename}, ${url}, ${alt}, ${width}, ${height})`
      })

      sql += mediaValues.join(',\n') + ';\n\n'
    }

    // Add posts
    if (posts.docs.length > 0) {
      sql += '-- Insert all posts\n'

      for (const post of posts.docs) {
        // Escape single quotes in strings
        const title = post.title.replace(/'/g, "''")
        const excerpt = post.excerpt ? `'${post.excerpt.replace(/'/g, "''")}'` : 'NULL'
        const content = post.content ? `'${JSON.stringify(post.content).replace(/'/g, "''")}'::jsonb` : 'NULL'
        const metaTitle = post.meta?.title ? `'${post.meta.title.replace(/'/g, "''")}'` : 'NULL'
        const metaDesc = post.meta?.description ? `'${post.meta.description.replace(/'/g, "''")}'` : 'NULL'
        const publishedAt = post.publishedAt ? `'${post.publishedAt}'` : 'now()'
        const createdAt = post.createdAt ? `'${post.createdAt}'` : 'now()'
        const updatedAt = post.updatedAt ? `'${post.updatedAt}'` : 'now()'

        sql += `INSERT INTO posts (id, title, slug, excerpt, content, _status, published_at, meta_title, meta_description, created_at, updated_at) VALUES\n`
        sql += `  (${post.id}, '${title}', '${post.slug}', ${excerpt}, ${content}, 'published', ${publishedAt}, ${metaTitle}, ${metaDesc}, ${createdAt}, ${updatedAt});\n`

        // Add category relationships
        if (post.categories && post.categories.length > 0) {
          for (let i = 0; i < post.categories.length; i++) {
            const catId = typeof post.categories[i] === 'object' ? post.categories[i].id : post.categories[i]
            sql += `INSERT INTO posts_rels (parent_id, "order", path, categories_id) VALUES (${post.id}, ${i}, 'categories', ${catId});\n`
          }
        }

        sql += '\n'
      }
    }

    // Add globals
    sql += `-- Insert globals
INSERT INTO header (id) VALUES (1);
INSERT INTO footer (id) VALUES (1);

-- Update sequences
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('media_id_seq', (SELECT MAX(id) FROM media));
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
SELECT setval('posts_rels_id_seq', (SELECT COALESCE(MAX(id), 0) FROM posts_rels));
`

    // Write SQL file
    const outputPath = path.join(process.cwd(), 'production-all-posts.sql')
    await fs.writeFile(outputPath, sql, 'utf-8')

    console.log(`\n✅ Exported to: ${outputPath}`)
    console.log(`📊 Total size: ${(sql.length / 1024).toFixed(2)} KB`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  }
}

exportAllPosts()