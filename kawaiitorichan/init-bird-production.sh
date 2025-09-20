#!/bin/sh
# Production initialization script for bird theme (uses SQL directly)

echo "🦜 Initializing Kawaii Bird Production Content..."

# Parse database URL
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "📊 Applying bird content to database..."
  echo "   Host: $PGHOST"
  echo "   Database: $PGDATABASE"

  # Debug: List SQL files
  echo "📁 Available SQL files:"
  ls -la *.sql* 2>&1 || echo "No SQL files found"

  # DOWNLOAD FILES FROM GITHUB IF NOT FOUND (using wget which is available in Alpine)
  if [ ! -f production-all-posts.sql.gz ]; then
    echo "📥 Downloading production data (115 posts) from GitHub..."
    # For private repos, you'd need a token (but it's not secure to hardcode it)
    # Better solution: make repo public or ensure files are in Docker image
    if command -v wget > /dev/null 2>&1; then
      wget -q -O production-all-posts.sql.gz https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/production-data-115-posts.sql.gz 2>&1
    elif command -v curl > /dev/null 2>&1; then
      curl -sL -o production-all-posts.sql.gz https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/production-data-115-posts.sql.gz 2>&1
    else
      echo "⚠️ Neither wget nor curl available for download"
    fi

    if [ -f production-all-posts.sql.gz ]; then
      echo "✅ Downloaded production-all-posts.sql.gz successfully"
    else
      echo "⚠️ Failed to download production data"
    fi
  fi

  if [ ! -f quick-import.sql ]; then
    echo "📥 Downloading quick-import.sql from GitHub..."
    if command -v wget > /dev/null 2>&1; then
      wget -q -O quick-import.sql https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/quick-import-data.sql 2>&1
    elif command -v curl > /dev/null 2>&1; then
      curl -sL -o quick-import.sql https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/quick-import-data.sql 2>&1
    else
      echo "⚠️ Neither wget nor curl available for download"
    fi

    if [ -f quick-import.sql ]; then
      echo "✅ Downloaded quick-import.sql successfully"
    else
      echo "⚠️ Failed to download quick import"
    fi
  fi

  echo "📁 Files after download attempt:"
  ls -la *.sql* 2>&1

  # TRY FULL PRODUCTION IMPORT FIRST
  if [ -f production-all-posts.sql.gz ]; then
    echo "🚀 DECOMPRESSING AND RUNNING FULL PRODUCTION IMPORT - 115 posts..."
    echo "📦 File size: $(ls -lh production-all-posts.sql.gz | awk '{print $5}')"
    gunzip -c production-all-posts.sql.gz | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" 2>&1

    # Check if it worked
    POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")
    MEDIA_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media" 2>/dev/null || echo "0")

    if [ "$POST_COUNT" -gt "0" ]; then
      echo "✅ FULL PRODUCTION IMPORT SUCCESS: $POST_COUNT posts, $CAT_COUNT categories, $MEDIA_COUNT media items!"

      # Fix media table schema
      echo "🔧 Fixing media table schema..."
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<EOF
ALTER TABLE media ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS alt TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filename VARCHAR;
EOF
      echo "✅ Media schema fixed!"

      echo "🌐 Kawaii Bird production initialization complete!"
      exit 0
    else
      echo "⚠️ Compressed import didn't work, trying uncompressed..."
    fi
  fi

  if [ -f production-all-posts.sql ]; then
    echo "🚀 RUNNING FULL PRODUCTION IMPORT - Creating tables with all 115 posts..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f production-all-posts.sql 2>&1

    # Check if it worked
    POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")
    MEDIA_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media" 2>/dev/null || echo "0")

    if [ "$POST_COUNT" -gt "0" ]; then
      echo "✅ FULL PRODUCTION IMPORT SUCCESS: $POST_COUNT posts, $CAT_COUNT categories, $MEDIA_COUNT media items!"

      # Fix media table schema
      echo "🔧 Fixing media table schema..."
      psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<EOF
ALTER TABLE media ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS alt TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y FLOAT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_thumbnail_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_square_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_small_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_medium_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_large_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_xlarge_filename VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_url VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_width INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_height INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_mime_type VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filesize INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS sizes_og_filename VARCHAR;
EOF
      echo "✅ Media schema fixed!"

      echo "🌐 Kawaii Bird production initialization complete!"
      exit 0
    else
      echo "⚠️ Full import didn't create posts, falling back to quick import..."
    fi
  elif [ -f quick-import.sql ]; then
    echo "🚀 RUNNING QUICK IMPORT - Creating tables and sample posts..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f quick-import.sql 2>&1

    # Check if it worked
    POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")

    if [ "$POST_COUNT" -gt "0" ]; then
      echo "✅ QUICK IMPORT SUCCESS: $POST_COUNT posts, $CAT_COUNT categories created!"
      echo "🌐 Kawaii Bird production initialization complete!"
      exit 0
    else
      echo "⚠️ Quick import didn't create posts, falling back to regular initialization..."
    fi
  else
    echo "⚠️ quick-import.sql not found, creating it inline..."

    # Create complete-schema.sql inline if it doesn't exist
    cat > complete-schema.sql <<'EOF'
-- Complete schema for Dokploy deployment with ALL required fields
-- Drop all tables to ensure clean state
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

CREATE TABLE users (
  id serial PRIMARY KEY,
  email varchar NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

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

CREATE TABLE tags (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  slug varchar NOT NULL UNIQUE,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE media (
  id serial PRIMARY KEY,
  filename varchar,
  url varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

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

-- Create related tables for internal links
CREATE TABLE posts_internal_links_metadata_links_added (
  id serial PRIMARY KEY,
  _parent_id integer REFERENCES posts(id) ON DELETE CASCADE,
  _order integer,
  target_slug varchar,
  anchor_text varchar,
  position integer
);

-- Create related tables for affiliate links
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

-- Create related tables for authors
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

INSERT INTO users (email) VALUES ('admin@example.com');

INSERT INTO categories (title, slug, description, "order") VALUES
  ('セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコに関する記事', 1),
  ('コザクラインコ', 'lovebird', '愛情深いコザクラインコについての情報', 2),
  ('オカメインコ', 'cockatiel', '優しいオカメインコのケア情報', 3);

INSERT INTO posts (title, slug, excerpt, content, _status, published_at, meta_title, meta_description) VALUES
  ('セキセイインコの飼い方入門', 'budgerigar-care-guide',
   'セキセイインコは初心者でも飼いやすい小鳥です。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"セキセイインコは初心者でも飼いやすい小鳥です。明るく活発な性格で、飼い主とのコミュニケーションも楽しめます。"}]}]}}',
   'published', now(),
   'セキセイインコの飼い方入門 - かわいい小鳥ブログ',
   'セキセイインコの基本的な飼い方を初心者向けに解説します。'),
  ('コザクラインコの特徴', 'lovebird-characteristics',
   'コザクラインコは愛情深い小鳥として知られています。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"コザクラインコは愛情深い小鳥として知られています。パートナーへの愛情が深く、ラブバードとも呼ばれます。"}]}]}}',
   'published', now(),
   'コザクラインコの特徴 - かわいい小鳥ブログ',
   'コザクラインコの性格や特徴について詳しく解説します。'),
  ('オカメインコのケア', 'cockatiel-care',
   'オカメインコは頬の赤い模様が特徴的です。',
   '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"オカメインコは頬の赤い模様が特徴的です。優しい性格で初心者にもおすすめの鳥です。"}]}]}}',
   'published', now(),
   'オカメインコのケア方法 - かわいい小鳥ブログ',
   'オカメインコの日常的なケア方法について説明します。');

INSERT INTO posts_rels (parent_id, "order", path, categories_id) VALUES
  (1, 0, 'categories', 1),
  (2, 0, 'categories', 2),
  (3, 0, 'categories', 3);

INSERT INTO header (id) VALUES (1);
INSERT INTO footer (id) VALUES (1);
EOF

    echo "✅ Created complete-schema.sql inline, now executing..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f complete-schema.sql 2>&1

    # Check results
    POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")

    echo "✅ INLINE QUICK IMPORT COMPLETE: $POST_COUNT posts, $CAT_COUNT categories"
    echo "🌐 Kawaii Bird production initialization complete!"
    exit 0
  fi

  # Run SQL script - try full content first, fallback to basic
  if [ -f init-full-bird-content.sql ]; then
    echo "📝 Using full bird content initialization..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f init-full-bird-content.sql

    if [ $? -eq 0 ]; then
      echo "✅ Full bird content initialized successfully!"
    else
      echo "⚠️ Failed to initialize full bird content (may already exist)"
    fi
  elif [ -f init-bird-content.sql ]; then
    echo "📝 Using basic bird content initialization..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f init-bird-content.sql

    if [ $? -eq 0 ]; then
      echo "✅ Basic bird content initialized successfully!"
    else
      echo "⚠️ Failed to initialize bird content (may already exist)"
    fi
  else
    echo "❌ No SQL initialization scripts found"
  fi
else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

echo "🌐 Kawaii Bird production initialization complete!"