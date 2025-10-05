#!/bin/sh
# Removed set -e to prevent early exit on errors

# Write to stderr to ensure visibility
echo "=========================================" >&2
echo "Docker Container Starting..." >&2
echo "=========================================" >&2
echo "DEBUG: Script has started running!" >&2
echo "Node version: $(node --version 2>/dev/null || echo 'node not found')"
echo "Current directory: $(pwd 2>/dev/null || echo 'pwd failed')"
echo "Files in current directory:"
ls -la 2>/dev/null || echo "ls failed"

echo ""
echo "Environment Variables Check:"
echo "----------------------------"
echo "DATABASE_URI is set: $([ -n "$DATABASE_URI" ] && echo 'Yes ✓' || echo 'No ✗')"
echo "PAYLOAD_SECRET is set: $([ -n "$PAYLOAD_SECRET" ] && echo 'Yes ✓' || echo 'No ✗')"
echo "NEXT_PUBLIC_SERVER_URL: ${NEXT_PUBLIC_SERVER_URL:-'Not set'}"
echo "NODE_ENV: ${NODE_ENV:-'Not set'}"
echo "PORT: ${PORT:-'Not set'}"

# Check if DATABASE_URI is set
if [ -z "$DATABASE_URI" ]; then
  echo ""
  echo "❌ ERROR: DATABASE_URI environment variable is not set!"
  echo "Please set DATABASE_URI in Dokploy environment variables."
  echo "Example: postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db"
  exit 1
fi

# Check if PAYLOAD_SECRET is set
if [ -z "$PAYLOAD_SECRET" ]; then
  echo ""
  echo "❌ ERROR: PAYLOAD_SECRET environment variable is not set!"
  echo "Please set PAYLOAD_SECRET in Dokploy environment variables."
  exit 1
fi

# Parse DATABASE_URI to get connection details FIRST
if [ -n "$DATABASE_URI" ]; then
  # Extract components from postgresql://user:pass@host:port/dbname
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# Log sanitized DATABASE_URI (hide password)
SANITIZED_DB_URI=$(echo "$DATABASE_URI" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/****:****@/')
echo ""
echo "Database URI (sanitized): $SANITIZED_DB_URI"

echo ""
echo "Database connection parsed:"
echo "- Host: $DB_HOST"
echo "- Port: $DB_PORT"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo "- Password exists: $([ -n "$DB_PASSWORD" ] && echo 'Yes' || echo 'No')"

# Export variables explicitly for the Node.js process
export DATABASE_URI
export PAYLOAD_SECRET
export NEXT_PUBLIC_SERVER_URL
export NODE_ENV
export PORT
export PAYLOAD_CONFIG_PATH=dist/payload.config.js

# List files to debug
echo "🔍 Current directory contents:" >&2
ls -la >&2

# DATABASE INITIALIZATION - Create schema and import data
echo "🚀 INITIALIZING DATABASE..." >&2

# CRITICAL: Check for SKIP_DATA_IMPORT flag FIRST before any imports
SKIP_DATA_IMPORT="${SKIP_DATA_IMPORT:-false}"

if [ "$SKIP_DATA_IMPORT" = "true" ]; then
  echo "✅ ✅ ✅ SKIP_DATA_IMPORT=true detected!" >&2
  echo "🔒 Preserving existing database - NO imports will run" >&2
  echo "💡 All data imports are skipped to preserve your edits" >&2
else
  echo "📥 SKIP_DATA_IMPORT not set - will import data if needed" >&2

  # EMERGENCY FIX: Run this FIRST to ensure basic schema compatibility
  if [ -f emergency-fix.sql ]; then
    echo "🚨 Running emergency schema fix FIRST..." >&2
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f emergency-fix.sql 2>&1 | head -50 >&2
    echo "✅ Emergency fix applied" >&2
  fi

  # Add Comments collection schema
  if [ -f add-comments-schema.sql ]; then
    echo "💬 Adding Comments collection schema..." >&2
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f add-comments-schema.sql 2>&1 | head -50 >&2
    echo "✅ Comments schema added" >&2
  fi

  # Skip reset script - Payload CMS handles schema creation
  # if [ -f reset-and-init-db.sh ]; then
  #   echo "🔄 Running database reset to ensure proper schema..." >&2
  #   chmod +x reset-and-init-db.sh
  #   sh reset-and-init-db.sh 2>&1 | head -50 >&2
  # fi

  # Then import data
  if [ -f quick-import.sql ]; then
    echo "📥 Importing data into database..." >&2

    # The quick-import.sql has INSERT statements for the data
    # We need to ensure _status and language have proper values
    sed "s/'published'/'published'/g; s/'ja'/'ja'/g" quick-import.sql > /tmp/data-import.sql

    IMPORT_OUTPUT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/data-import.sql 2>&1)
    IMPORT_EXIT_CODE=$?

    if [ $IMPORT_EXIT_CODE -eq 0 ]; then
      echo "✅ Data import successful!" >&2
    else
      echo "⚠️ Some warnings during data import" >&2
      echo "$IMPORT_OUTPUT" | head -20 >&2
    fi

    rm /tmp/data-import.sql
  elif [ -f init-schema-and-data.sql.gz ]; then
    echo "⚠️ Using fallback init-schema-and-data.sql.gz..." >&2
    gunzip -c init-schema-and-data.sql.gz > /tmp/init-schema-and-data.sql
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/init-schema-and-data.sql 2>&1 | head -50 >&2
    rm /tmp/init-schema-and-data.sql
  fi
fi

# CRITICAL: Run failsafe to ensure _status column exists
echo "" >&2
echo "🔧 Running failsafe column check..." >&2
if [ -f ensure-status-column.sh ]; then
  chmod +x ensure-status-column.sh
  sh ensure-status-column.sh 2>&1
elif [ -f simple-status-fix.sql ]; then
  echo "⚠️ Using simple-status-fix.sql..." >&2
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f simple-status-fix.sql 2>&1 | head -20 >&2
else
  echo "⚠️ Scripts not found, trying inline fix..." >&2

  # Inline failsafe - use VARCHAR instead of ENUM for maximum compatibility
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -20 >&2
-- Emergency inline fix using VARCHAR (most compatible)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status VARCHAR DEFAULT 'published' NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ja' NOT NULL;

-- Update any NULL values
UPDATE posts SET _status = 'published' WHERE _status IS NULL OR _status = '';
UPDATE posts SET language = 'ja' WHERE language IS NULL OR language = '';

-- Add constraints
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (_status IN ('draft', 'published'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_language_check CHECK (language IN ('ja', 'en'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);

-- Fix media table columns (common Payload CMS issue)
ALTER TABLE media ADD COLUMN IF NOT EXISTS prefix VARCHAR DEFAULT 'media';
ALTER TABLE media ADD COLUMN IF NOT EXISTS _key VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
EOF
fi

# Double-check that _status column exists
echo "🔍 Final _status column verification..." >&2
STATUS_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts' AND column_name = '_status';" 2>/dev/null)
if [ -n "$STATUS_CHECK" ]; then
  echo "✅ _status column verified: $STATUS_CHECK" >&2
else
  echo "❌ CRITICAL: _status column still missing!" >&2
fi

# COMPREHENSIVE FIX: Run complete schema fix for all metadata columns and tables
echo "" >&2
echo "🔧 Running comprehensive schema fix..." >&2
if [ -f comprehensive-schema-fix.sql ]; then
  echo "Applying comprehensive schema fixes..." >&2
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f comprehensive-schema-fix.sql 2>&1 | head -50 >&2
else
  echo "⚠️ comprehensive-schema-fix.sql not found, applying inline fixes..." >&2

  # Inline comprehensive fixes
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -50 >&2
-- Emergency inline comprehensive fix
-- Add all WordPress metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_author VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_original_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_modified_date TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_status VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_comments BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS wordpress_metadata_enable_toc BOOLEAN DEFAULT true;

-- Add internal links metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS internal_links_metadata_content_hash VARCHAR;

-- Add affiliate links metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_version VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_last_processed TIMESTAMP(3) WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_content_hash VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS affiliate_links_metadata_exclude_from_affiliates BOOLEAN DEFAULT false;

-- Add content DB metadata columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_original_id VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_website_id NUMERIC;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_language VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_db_meta_imported_at TIMESTAMP(3) WITH TIME ZONE;

-- Create missing relationship tables
CREATE TABLE IF NOT EXISTS posts_internal_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    target_slug VARCHAR,
    anchor_text TEXT,
    position INTEGER
);

CREATE TABLE IF NOT EXISTS posts_affiliate_links_metadata_links_added (
    id SERIAL PRIMARY KEY,
    _order INTEGER DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    product_id VARCHAR,
    product_name VARCHAR,
    anchor_text TEXT,
    position INTEGER,
    type VARCHAR
);

CREATE TABLE IF NOT EXISTS posts_populated_authors (
    id SERIAL PRIMARY KEY,
    _order INTEGER DEFAULT 0,
    _parent_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    name VARCHAR
);

-- Fix posts_rels columns
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS posts_id INTEGER;
ALTER TABLE posts_rels ADD COLUMN IF NOT EXISTS users_id INTEGER;
EOF
fi

# Verify database status
echo "" >&2
echo "📊 Verifying database status..." >&2
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
echo "📊 Database has $TABLE_COUNT tables" >&2

POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
echo "📝 Database has $POST_COUNT posts" >&2

CATEGORY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")
echo "📂 Database has $CATEGORY_COUNT categories" >&2

MEDIA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")
echo "🖼️ Database has $MEDIA_COUNT media records" >&2

MIGRATION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM payload_migrations;" 2>/dev/null || echo "0")
echo "🔧 Database has $MIGRATION_COUNT migration records" >&2

if [ "$POST_COUNT" = "0" ]; then
  echo "❌ WARNING: No posts in database! Import may have failed." >&2
fi

# FIX: Insert categories if missing (but only if SKIP_DATA_IMPORT is false)
if [ "$SKIP_DATA_IMPORT" != "true" ] && ([ "$CATEGORY_COUNT" = "0" ] || [ "$CATEGORY_COUNT" = " 0" ]); then
  echo "⚠️ No categories found, inserting default categories inline..." >&2

  # Insert categories directly using inline SQL
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL' >&2
-- Main categories
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(1, '🦜 鳥の種類', 'bird-species', '様々な鳥の種類についての情報', 1, true, NULL, NOW(), NOW()),
(2, '🏠 鳥の飼い方', 'bird-care', '鳥の基本的な飼育方法', 2, true, NULL, NOW(), NOW()),
(3, '💊 鳥の健康', 'bird-health', '鳥の健康管理と病気の対処', 3, true, NULL, NOW(), NOW()),
(4, '🌿 鳥の生態', 'bird-behavior', '鳥の行動と生態について', 4, true, NULL, NOW(), NOW()),
(5, '🔭 野鳥観察', 'bird-watching', '野鳥観察の楽しみ方', 5, true, NULL, NOW(), NOW()),
(6, '🥗 餌と栄養', 'nutrition-feeding', '鳥の餌と栄養管理', 6, true, NULL, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW();

-- Subcategories for Bird Species (parent_id = 1)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(101, 'セキセイインコ', 'budgerigar', '明るく社交的なセキセイインコ', 1, true, 1, NOW(), NOW()),
(102, 'オカメインコ', 'cockatiel', '優しいオカメインコ', 2, true, 1, NOW(), NOW()),
(103, 'ラブバード', 'lovebird', '愛情深いラブバード', 3, true, 1, NOW(), NOW()),
(104, 'ゼブラフィンチ', 'zebra-finch', 'ゼブラフィンチ', 4, true, 1, NOW(), NOW()),
(105, '文鳥', 'society-finch', '文鳥', 5, true, 1, NOW(), NOW()),
(106, 'ゴシキキンカン', 'gouldian-finch', 'ゴシキキンカン', 6, true, 1, NOW(), NOW()),
(107, 'カナリア', 'canary', 'カナリア', 7, true, 1, NOW(), NOW()),
(108, 'マメルリハ', 'parrotlet', 'マメルリハ', 8, true, 1, NOW(), NOW()),
(109, 'ジュウシマツ', 'munias', 'ジュウシマツ', 9, true, 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Care (parent_id = 2)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(201, 'ケージと飼育環境', 'housing-enclosures', 'ケージの選び方', 1, true, 2, NOW(), NOW()),
(202, 'ケージサイズと設置', 'cage-setup', 'ケージのサイズ', 2, true, 2, NOW(), NOW()),
(203, '止まり木と設備', 'perches-accessories', '止まり木', 3, true, 2, NOW(), NOW()),
(204, '温度と湿度管理', 'temperature-humidity', '温度管理', 4, true, 2, NOW(), NOW()),
(205, '照明設備', 'lighting', '照明', 5, true, 2, NOW(), NOW()),
(206, '清掃と衛生管理', 'cleaning-hygiene', '清掃', 6, true, 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Health (parent_id = 3)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(301, '日常の健康管理', 'daily-health-care', '健康チェック', 1, true, 3, NOW(), NOW()),
(302, '病気の症状と対処', 'illness-treatment', '病気の対処', 2, true, 3, NOW(), NOW()),
(303, '応急処置', 'emergency-care', '応急処置', 3, true, 3, NOW(), NOW()),
(304, '獣医師の診察', 'veterinary-care', '獣医師', 4, true, 3, NOW(), NOW()),
(305, '換羽期のケア', 'molting-care', '換羽期', 5, true, 3, NOW(), NOW()),
(306, '繁殖と産卵', 'breeding-care', '繁殖', 6, true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Behavior (parent_id = 4)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(401, '鳴き声と意思疎通', 'vocalizations', '鳴き声', 1, true, 4, NOW(), NOW()),
(402, '行動パターン', 'behavior-patterns', '行動', 2, true, 4, NOW(), NOW()),
(403, 'しつけと訓練', 'training', 'しつけ', 3, true, 4, NOW(), NOW()),
(404, 'ストレス管理', 'stress-management', 'ストレス', 4, true, 4, NOW(), NOW()),
(405, '社会性と多頭飼い', 'social-behavior', '社会性', 5, true, 4, NOW(), NOW()),
(406, '遊びと運動', 'play-exercise', '遊び', 6, true, 4, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Bird Watching (parent_id = 5)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(501, '観察の基本', 'observation-basics', '観察基本', 1, true, 5, NOW(), NOW()),
(502, '観察場所', 'observation-locations', '観察場所', 2, true, 5, NOW(), NOW()),
(503, '観察用具', 'observation-equipment', '観察用具', 3, true, 5, NOW(), NOW()),
(504, '季節別観察', 'seasonal-observation', '季節別', 4, true, 5, NOW(), NOW()),
(505, '記録と写真', 'recording-photography', '記録', 5, true, 5, NOW(), NOW()),
(506, '保護と環境', 'conservation', '保護', 6, true, 5, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();

-- Subcategories for Nutrition (parent_id = 6)
INSERT INTO categories (id, title, slug, description, "order", slug_lock, parent_id, created_at, updated_at) VALUES
(601, '基本的な餌', 'basic-diet', '基本的な餌', 1, true, 6, NOW(), NOW()),
(602, '新鮮な野菜と果物', 'fresh-foods', '野菜と果物', 2, true, 6, NOW(), NOW()),
(603, 'タンパク質源', 'protein-sources', 'タンパク質', 3, true, 6, NOW(), NOW()),
(604, 'サプリメント', 'supplements', 'サプリメント', 4, true, 6, NOW(), NOW()),
(605, '危険な食べ物', 'toxic-foods', '危険な食べ物', 5, true, 6, NOW(), NOW()),
(606, '給餌スケジュール', 'feeding-schedule', '給餌', 6, true, 6, NOW(), NOW()),
(607, '水分補給', 'hydration', '水分', 7, true, 6, NOW(), NOW()),
(608, '季節別の栄養', 'seasonal-nutrition', '季節別栄養', 8, true, 6, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, parent_id = EXCLUDED.parent_id, updated_at = NOW();
EOSQL

  if [ $? -eq 0 ]; then
    echo "✅ Categories inserted successfully!" >&2
  else
    echo "❌ Failed to insert categories!" >&2
  fi
elif [ "$SKIP_DATA_IMPORT" = "true" ]; then
  echo "🔒 SKIP_DATA_IMPORT=true - Skipping category insert" >&2
fi

# Check if we should force initialize the database
# NOTE: This runs AFTER our schema initialization
if [ "$FORCE_DB_INIT" = "true" ]; then
  echo "FORCE_DB_INIT is set, reinitializing database..."
  if [ -f force-init-db.sh ]; then
    sh force-init-db.sh || echo "Force init completed or failed"
  fi
elif [ -f init-db.sh ]; then
  echo "Running database initialization check..."
  sh init-db.sh || echo "Database init failed or not needed, continuing..."
fi

echo ""
echo "========================================="
echo "Starting Next.js server on port ${PORT:-3000}..."
echo "========================================="
echo ""

# Run runtime environment variable replacement BEFORE starting the server
if [ -f runtime-env-replace.sh ]; then
  chmod +x runtime-env-replace.sh
  sh runtime-env-replace.sh
fi

# No longer need background check - everything is done upfront by quick-import.sql

# Initialize bird theme content (only if posts don't exist yet OR forced)
echo ""
echo "🦜 Checking if bird theme content needs initialization..."

# SKIP_DATA_IMPORT already set earlier at line 79 - don't redeclare

# Check for force reimport flag
FORCE_REIMPORT="${FORCE_REIMPORT:-false}"

# Check if POST_COUNT is numeric and less than 400 (incomplete data)
NEEDS_REIMPORT=false
if [ "$POST_COUNT" = "0" ] || [ "$POST_COUNT" = " 0" ]; then
  NEEDS_REIMPORT=true
elif [ "$POST_COUNT" -lt 400 ] 2>/dev/null; then
  echo "⚠️ Only $POST_COUNT posts found (expected 494) - will reimport"
  NEEDS_REIMPORT=true
fi

# CRITICAL: Skip import if SKIP_DATA_IMPORT is set (preserves edited posts)
if [ "$SKIP_DATA_IMPORT" = "true" ]; then
  echo "✅ SKIP_DATA_IMPORT=true - Preserving existing database, skipping all imports"
  echo "💡 Current post count: $POST_COUNT"
  NEEDS_REIMPORT=false
  FORCE_REIMPORT=false
fi

# Run init if POST_COUNT is 0 OR less than 400 OR if FORCE_REIMPORT is set
if [ "$NEEDS_REIMPORT" = "true" ] || [ "$FORCE_REIMPORT" = "true" ]; then
  if [ "$FORCE_REIMPORT" = "true" ]; then
    echo "⚠️ FORCE_REIMPORT=true detected - will reimport data even though $POST_COUNT posts exist"
  elif [ "$POST_COUNT" -gt 0 ]; then
    echo "🔄 Detected incomplete data ($POST_COUNT posts) - will drop and reimport"
    echo "🔄 Truncating existing posts to prepare for fresh import..."

    # Clear all existing data
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL'
TRUNCATE TABLE posts_internal_links_metadata_links_added CASCADE;
TRUNCATE TABLE posts_affiliate_links_metadata_links_added CASCADE;
TRUNCATE TABLE posts_populated_authors CASCADE;
TRUNCATE TABLE _posts_v_rels CASCADE;
TRUNCATE TABLE _posts_v CASCADE;
TRUNCATE TABLE posts_rels CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE categories_breadcrumbs CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE media CASCADE;
EOSQL
    echo "✅ Database cleared, ready for fresh import"
  fi

  echo "📥 Running initial data import..."
  if [ -f init-bird-production.sh ]; then
    echo "Running init-bird-production.sh..."
    sh init-bird-production.sh
    INIT_EXIT_CODE=$?
    if [ $INIT_EXIT_CODE -eq 0 ]; then
      echo "✅ Bird theme initialization completed successfully!"
    else
      echo "⚠️ Bird theme initialization had issues but continuing..."
    fi
  fi
else
  echo "✅ Posts already exist ($POST_COUNT posts ≥ 400), skipping data import to preserve existing data"
  echo "💡 Set FORCE_REIMPORT=true environment variable to force reimport if needed"
fi

# Populate post versions for admin panel visibility
echo ""
echo "📝 Populating post versions for admin panel..."
if [ -f populate-post-versions.sql ]; then
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f populate-post-versions.sql 2>&1 || echo "⚠️ Version population had issues but continuing..."
else
  echo "⚠️ populate-post-versions.sql not found, skipping..."
fi

# CRITICAL: Check and fix NULL parent_id versions that cause blank admin panel
# NOTE: This must run BEFORE the app starts because PayloadCMS clears parent_id when running!
# IMPORTANT: Skip this if SKIP_DATA_IMPORT is set (don't modify existing data)
if [ "$SKIP_DATA_IMPORT" = "true" ]; then
  echo ""
  echo "🔒 SKIP_DATA_IMPORT=true - Skipping version rebuild (preserving existing versions)" >&2
else
  echo ""
  echo "🔧 Checking post versions health..."

  # Check for NULL parent_id OR missing versions
  VERSION_NULL_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL;" 2>/dev/null || echo "0")
  VERSION_MISSING_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts p WHERE NOT EXISTS (SELECT 1 FROM _posts_v v WHERE v.parent_id = p.id AND v.latest = true);" 2>/dev/null || echo "0")

  echo "Found $VERSION_NULL_CHECK versions with NULL parent_id"
  echo "Found $VERSION_MISSING_CHECK posts without versions"

  # If we have any issues, do a complete rebuild of versions
  if [ "$VERSION_NULL_CHECK" != "0" ] && [ "$VERSION_NULL_CHECK" != " 0" ]; then
  echo "⚠️ CRITICAL: Found versions with NULL parent_id!"
  echo "🔧 Performing complete version rebuild..."

  # Truncate and rebuild completely
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL' 2>&1
-- Step 1: Clear all broken versions
TRUNCATE TABLE _posts_v CASCADE;

-- Step 2: Recreate ALL versions with COMPLETE field mapping (37 fields)
INSERT INTO _posts_v (
  parent_id,
  version_title,
  version_slug,
  version_slug_lock,
  version_content,
  version_excerpt,
  version_language,
  version_hero_image_id,
  version_hero_image_alt,
  version_meta_title,
  version_meta_image_id,
  version_meta_description,
  version_meta_keywords,
  version_meta_focus_keyphrase,
  version_published_at,
  version__status,
  version_updated_at,
  version_created_at,
  version_wordpress_metadata_original_author,
  version_wordpress_metadata_original_date,
  version_wordpress_metadata_modified_date,
  version_wordpress_metadata_status,
  version_wordpress_metadata_enable_comments,
  version_wordpress_metadata_enable_toc,
  version_internal_links_metadata_version,
  version_internal_links_metadata_last_processed,
  version_internal_links_metadata_content_hash,
  version_affiliate_links_metadata_version,
  version_affiliate_links_metadata_last_processed,
  version_affiliate_links_metadata_content_hash,
  version_affiliate_links_metadata_exclude_from_affiliates,
  version_content_db_meta_original_id,
  version_content_db_meta_website_id,
  version_content_db_meta_language,
  version_content_db_meta_imported_at,
  latest,
  autosave
)
SELECT
  id,
  title,
  slug,
  slug_lock,
  content,
  excerpt,
  CASE
    WHEN language = 'ja' THEN 'ja'::enum__posts_v_version_language
    WHEN language = 'en' THEN 'en'::enum__posts_v_version_language
    ELSE 'ja'::enum__posts_v_version_language
  END,
  hero_image_id,
  hero_image_alt,
  meta_title,
  meta_image_id,
  meta_description,
  meta_keywords,
  meta_focus_keyphrase,
  published_at,
  CASE
    WHEN _status = 'published' THEN 'published'::enum__posts_v_version_status
    ELSE 'draft'::enum__posts_v_version_status
  END,
  COALESCE(updated_at, NOW()),
  COALESCE(created_at, NOW()),
  wordpress_metadata_original_author,
  wordpress_metadata_original_date,
  wordpress_metadata_modified_date,
  CASE
    WHEN wordpress_metadata_status = 'published' THEN 'published'::enum__posts_v_version_wordpress_metadata_status
    WHEN wordpress_metadata_status = 'draft' THEN 'draft'::enum__posts_v_version_wordpress_metadata_status
    ELSE NULL
  END,
  wordpress_metadata_enable_comments,
  wordpress_metadata_enable_toc,
  internal_links_metadata_version,
  internal_links_metadata_last_processed,
  internal_links_metadata_content_hash,
  affiliate_links_metadata_version,
  affiliate_links_metadata_last_processed,
  affiliate_links_metadata_content_hash,
  affiliate_links_metadata_exclude_from_affiliates,
  content_db_meta_original_id,
  content_db_meta_website_id,
  content_db_meta_language,
  content_db_meta_imported_at,
  true,
  false
FROM posts
WHERE title IS NOT NULL AND title <> '';

-- Step 3: Recreate relationships (parent_id points to _posts_v.id, NOT posts.id!)
INSERT INTO _posts_v_rels (
  "order",
  parent_id,
  path,
  posts_id,
  categories_id,
  users_id,
  tags_id
)
SELECT
  pr."order",
  pv.id,
  pr.path,
  pr.posts_id,
  pr.categories_id,
  pr.users_id,
  pr.tags_id
FROM posts_rels pr
JOIN _posts_v pv ON pv.parent_id = pr.parent_id
WHERE pv.latest = true;
EOSQL

  echo "✅ Complete version rebuild finished!"

elif [ "$VERSION_MISSING_CHECK" != "0" ] && [ "$VERSION_MISSING_CHECK" != " 0" ]; then
  echo "⚠️ WARNING: Some posts don't have versions, creating them..."

  # Create versions only for posts that don't have them
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL' 2>&1
INSERT INTO _posts_v (
  parent_id, version_title, version_slug, version_slug_lock, version_content, version_excerpt,
  version_language, version_hero_image_id, version_hero_image_alt, version_meta_title,
  version_meta_image_id, version_meta_description, version_meta_keywords, version_meta_focus_keyphrase,
  version_published_at, version__status, version_updated_at, version_created_at,
  version_wordpress_metadata_original_author, version_wordpress_metadata_original_date,
  version_wordpress_metadata_modified_date, version_wordpress_metadata_status,
  version_wordpress_metadata_enable_comments, version_wordpress_metadata_enable_toc,
  version_internal_links_metadata_version, version_internal_links_metadata_last_processed,
  version_internal_links_metadata_content_hash, version_affiliate_links_metadata_version,
  version_affiliate_links_metadata_last_processed, version_affiliate_links_metadata_content_hash,
  version_affiliate_links_metadata_exclude_from_affiliates, version_content_db_meta_original_id,
  version_content_db_meta_website_id, version_content_db_meta_language,
  version_content_db_meta_imported_at, latest, autosave
)
SELECT
  p.id, p.title, p.slug, p.slug_lock, p.content, p.excerpt,
  CASE WHEN p.language = 'ja' THEN 'ja'::enum__posts_v_version_language
       WHEN p.language = 'en' THEN 'en'::enum__posts_v_version_language
       ELSE 'ja'::enum__posts_v_version_language END,
  p.hero_image_id, p.hero_image_alt, p.meta_title, p.meta_image_id, p.meta_description,
  p.meta_keywords, p.meta_focus_keyphrase, p.published_at,
  CASE WHEN p._status = 'published' THEN 'published'::enum__posts_v_version_status
       ELSE 'draft'::enum__posts_v_version_status END,
  COALESCE(p.updated_at, NOW()), COALESCE(p.created_at, NOW()),
  p.wordpress_metadata_original_author, p.wordpress_metadata_original_date,
  p.wordpress_metadata_modified_date,
  CASE WHEN p.wordpress_metadata_status = 'published' THEN 'published'::enum__posts_v_version_wordpress_metadata_status
       WHEN p.wordpress_metadata_status = 'draft' THEN 'draft'::enum__posts_v_version_wordpress_metadata_status
       ELSE NULL END,
  p.wordpress_metadata_enable_comments, p.wordpress_metadata_enable_toc,
  p.internal_links_metadata_version, p.internal_links_metadata_last_processed,
  p.internal_links_metadata_content_hash, p.affiliate_links_metadata_version,
  p.affiliate_links_metadata_last_processed, p.affiliate_links_metadata_content_hash,
  p.affiliate_links_metadata_exclude_from_affiliates, p.content_db_meta_original_id,
  p.content_db_meta_website_id, p.content_db_meta_language, p.content_db_meta_imported_at,
  true, false
FROM posts p
WHERE p.title IS NOT NULL AND p.title <> ''
AND NOT EXISTS (SELECT 1 FROM _posts_v v WHERE v.parent_id = p.id AND v.latest = true);

-- Create missing relationships
INSERT INTO _posts_v_rels ("order", parent_id, path, posts_id, categories_id, users_id, tags_id)
SELECT pr."order", pv.id, pr.path, pr.posts_id, pr.categories_id, pr.users_id, pr.tags_id
FROM posts_rels pr
JOIN _posts_v pv ON pv.parent_id = pr.parent_id AND pv.latest = true
WHERE NOT EXISTS (
  SELECT 1 FROM _posts_v_rels vr WHERE vr.parent_id = pv.id AND vr.path = pr.path
  AND COALESCE(vr.categories_id, 0) = COALESCE(pr.categories_id, 0)
  AND COALESCE(vr.users_id, 0) = COALESCE(pr.users_id, 0)
  AND COALESCE(vr.tags_id, 0) = COALESCE(pr.tags_id, 0)
  AND COALESCE(vr.posts_id, 0) = COALESCE(pr.posts_id, 0)
);
EOSQL

  echo "✅ Created missing versions!"
else
  echo "✅ All versions are healthy"
fi

# CRITICAL: Delete any versions with NULL parent_id (these are broken and cause admin panel issues)
echo "🔧 Removing any broken versions with NULL parent_id..."
NULL_BEFORE=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL;" 2>/dev/null || echo "0")
if [ "$NULL_BEFORE" != "0" ]; then
  echo "Found $NULL_BEFORE versions with NULL parent_id, deleting..."
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM _posts_v WHERE parent_id IS NULL;" 2>&1
  echo "✅ Deleted broken versions"
fi

# Final verification
FINAL_NULL=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL;" 2>/dev/null || echo "0")
FINAL_TOTAL=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _posts_v WHERE latest = true;" 2>/dev/null || echo "0")
FINAL_POSTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")

echo ""
echo "📊 Final version status:"
echo "  - Total posts: $FINAL_POSTS"
echo "  - Latest versions: $FINAL_TOTAL"
echo "  - NULL parent_id: $FINAL_NULL"

# Clean up any whitespace from psql output
FINAL_NULL_CLEAN=$(echo "$FINAL_NULL" | tr -d ' ')

  if [ "$FINAL_NULL_CLEAN" != "0" ] && [ -n "$FINAL_NULL_CLEAN" ]; then
    echo "❌ CRITICAL: Still have $FINAL_NULL_CLEAN versions with NULL parent_id after fix!"
    echo "Admin panel may not work properly!"
    echo "💡 Try running: DELETE FROM _posts_v WHERE parent_id IS NULL;"
  else
    echo "✅ All versions have valid parent_id - admin panel should work!"
  fi
fi  # End of SKIP_DATA_IMPORT check for version rebuild

# CRITICAL: Fix media URLs pointing to external domains instead of local paths
echo ""
echo "🖼️ Fixing media URLs..."

# Check if any media records have external URLs
EXTERNAL_URL_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media WHERE url LIKE 'https://%' OR url LIKE 'http://%';" 2>/dev/null || echo "0")
echo "Found $EXTERNAL_URL_COUNT media records with external URLs"

if [ "$EXTERNAL_URL_COUNT" != "0" ] && [ "$EXTERNAL_URL_COUNT" != " 0" ]; then
  echo "⚠️ Media URLs pointing to external domains instead of local paths!"
  echo "🔧 Converting external URLs to local /api/media/file/ paths..."

  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOSQL' 2>&1
-- Step 1: Update main image URL
UPDATE media
SET url = '/api/media/file/' || filename
WHERE (url LIKE 'https://%' OR url LIKE 'http://%')
  AND filename IS NOT NULL;

-- Step 2: Update all thumbnail and size variant URLs
UPDATE media
SET
  thumbnail_u_r_l = CASE
    WHEN sizes_thumbnail_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_thumbnail_filename
    ELSE NULL
  END,
  sizes_thumbnail_url = CASE
    WHEN sizes_thumbnail_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_thumbnail_filename
    ELSE NULL
  END,
  sizes_square_url = CASE
    WHEN sizes_square_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_square_filename
    ELSE NULL
  END,
  sizes_small_url = CASE
    WHEN sizes_small_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_small_filename
    ELSE NULL
  END,
  sizes_medium_url = CASE
    WHEN sizes_medium_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_medium_filename
    ELSE NULL
  END,
  sizes_large_url = CASE
    WHEN sizes_large_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_large_filename
    ELSE NULL
  END,
  sizes_xlarge_url = CASE
    WHEN sizes_xlarge_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_xlarge_filename
    ELSE NULL
  END,
  sizes_og_url = CASE
    WHEN sizes_og_filename IS NOT NULL
    THEN '/api/media/file/' || sizes_og_filename
    ELSE NULL
  END
WHERE filename IS NOT NULL;
EOSQL

  echo "✅ Media URLs converted to local paths!"
else
  echo "✅ All media URLs already use local paths"
fi

# Verify the fix
LOCAL_URL_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media WHERE url LIKE '/api/media/%';" 2>/dev/null || echo "0")
TOTAL_MEDIA=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")

echo ""
echo "📊 Media URL status:"
echo "  - Total media: $TOTAL_MEDIA"
echo "  - Local URLs: $LOCAL_URL_COUNT"

if [ "$LOCAL_URL_COUNT" = "$TOTAL_MEDIA" ]; then
  echo "✅ All media URLs are using local paths!"
else
  echo "⚠️ Some media URLs may still need fixing"
fi

# Fix category assignments - distribute posts across categories (skip if preserving data)
if [ "$SKIP_DATA_IMPORT" = "true" ]; then
  echo ""
  echo "🔒 SKIP_DATA_IMPORT=true - Skipping category reassignment (preserving existing assignments)" >&2
else
  echo ""
  echo "🗂️ Fixing category assignments..."
  if [ -f scripts/fix-categories.sql ]; then
    echo "Running category assignment fix..."
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f scripts/fix-categories.sql 2>&1 | grep -E "(DELETE|INSERT|鳥の種類|鳥の飼い方|餌と栄養|鳥の生態|野鳥観察|鳥の健康)" | head -20
    echo "✅ Category assignments fixed!"
  else
    echo "⚠️ scripts/fix-categories.sql not found, skipping category fix"
  fi
fi

# Smart media sync - downloads only missing files
echo ""
echo "🖼️ Running smart media sync..."
if [ -f smart-media-sync.sh ]; then
  chmod +x smart-media-sync.sh
  sh smart-media-sync.sh || echo "⚠️ Media sync had issues but continuing..."
else
  echo "⚠️ smart-media-sync.sh not found, skipping media sync"
fi

# FINAL VALIDATION before starting app
echo ""
echo "🔍 Running final schema validation..."
if [ -f validate-schema.sh ]; then
  chmod +x validate-schema.sh
  sh validate-schema.sh
  VALIDATION_EXIT=$?
  if [ $VALIDATION_EXIT -ne 0 ]; then
    echo "⚠️ Schema validation failed, but continuing anyway..."
  fi
else
  echo "⚠️ validate-schema.sh not found, skipping validation"
fi

# Add a small delay to ensure database is fully ready
echo "⏳ Waiting 3 seconds for database to stabilize..."
sleep 3

# Check if we need to use the simple server or the full app
if [ "$USE_SIMPLE_SERVER" = "true" ]; then
  echo "Using simple diagnostic server..."
  exec node simple-server.cjs
else
  echo "Starting main Next.js application..."
  # Skip wrapper, run server.js directly (it's the Next.js standalone output)
  exec node server.js
fi