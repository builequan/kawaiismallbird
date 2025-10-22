#!/bin/sh
# SIMPLE CLEAN IMPORT - Always drops and recreates
# No conditions, no checks, just clean import

echo "🔥 FORCE CLEAN IMPORT - Dropping ALL tables and importing fresh data"

# Parse database URL
PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE

echo "📊 Database: $PGUSER@$PGHOST:$PGPORT/$PGDATABASE"

# STEP 1: DROP EVERYTHING
echo "🗑️  Step 1/3: Dropping all tables..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<'EOF'
DROP TABLE IF EXISTS posts_internal_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS posts_affiliate_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS posts_populated_authors CASCADE;
DROP TABLE IF EXISTS posts_rels CASCADE;
DROP TABLE IF EXISTS _posts_v_version_internal_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS _posts_v_version_affiliate_links_metadata_links_added CASCADE;
DROP TABLE IF EXISTS _posts_v_version_populated_authors CASCADE;
DROP TABLE IF EXISTS _posts_v_rels CASCADE;
DROP TABLE IF EXISTS _posts_v CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS categories_breadcrumbs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS payload_locked_documents_rels CASCADE;
DROP TABLE IF EXISTS payload_locked_documents CASCADE;
DROP TABLE IF EXISTS payload_preferences_rels CASCADE;
DROP TABLE IF EXISTS payload_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS pages_blocks CASCADE;
DROP TABLE IF EXISTS pages_rels CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS header CASCADE;
DROP TABLE IF EXISTS footer CASCADE;
EOF

echo "✅ All tables dropped"

# STEP 2: CREATE SCHEMA
echo "📋 Step 2/3: Creating schema..."
if [ -f schema.sql ]; then
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f schema.sql 2>&1 | grep -v "NOTICE"
  echo "✅ Schema created"
else
  echo "❌ schema.sql not found!"
  exit 1
fi

# STEP 3: IMPORT DATA
echo "📦 Step 3/3: Importing data..."
if [ -f production-data-267-posts.sql.gz ]; then
  gunzip -c production-data-267-posts.sql.gz | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" 2>&1 | grep -v "NOTICE"

  # Count results
  POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
  CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")
  MEDIA_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media" 2>/dev/null || echo "0")

  echo "✅ Import complete: $POST_COUNT posts, $CAT_COUNT categories, $MEDIA_COUNT media"
else
  echo "❌ production-data-267-posts.sql.gz not found!"
  exit 1
fi

echo "🎉 CLEAN IMPORT SUCCESSFUL!"
