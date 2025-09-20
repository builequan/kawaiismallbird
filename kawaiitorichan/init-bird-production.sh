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

  # TRY QUICK IMPORT FIRST FOR CLEAN SETUP WITH SAMPLE DATA
  if [ -f quick-import.sql ]; then
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

    # Create quick-import.sql inline if it doesn't exist
    cat > quick-import.sql <<'EOF'
-- Quick import script for Dokploy deployment
DROP TABLE IF EXISTS posts_rels CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
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
  parent_id integer,
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
  wordpress_metadata_enable_comments boolean,
  _status varchar DEFAULT 'published',
  published_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE posts_rels (
  id serial PRIMARY KEY,
  parent_id integer,
  path varchar,
  category_id integer
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

INSERT INTO categories (title, slug) VALUES
  ('セキセイインコ', 'budgerigar'),
  ('コザクラインコ', 'lovebird'),
  ('オカメインコ', 'cockatiel');

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

INSERT INTO posts_rels (parent_id, path, category_id) VALUES
  (1, 'categories', 1),
  (2, 'categories', 2),
  (3, 'categories', 3);

INSERT INTO header (id) VALUES (1);
INSERT INTO footer (id) VALUES (1);
EOF

    echo "✅ Created quick-import.sql inline, now executing..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f quick-import.sql 2>&1

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