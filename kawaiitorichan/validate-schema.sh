#!/bin/sh
# Schema validation script - ensures database is ready before app starts

echo "🔍 VALIDATING DATABASE SCHEMA..." >&2

# Parse DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# Function to check if table exists
check_table() {
  local table=$1
  local exists=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '$table');" 2>/dev/null | tr -d ' ')
  echo "$exists"
}

# Function to check if column exists
check_column() {
  local table=$1
  local column=$2
  local exists=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '$table' AND column_name = '$column');" 2>/dev/null | tr -d ' ')
  echo "$exists"
}

echo "📋 Checking required tables..." >&2

# Check core tables
REQUIRED_TABLES="posts media categories tags users pages payload_migrations payload_preferences posts_rels"
MISSING_TABLES=""

for table in $REQUIRED_TABLES; do
  if [ "$(check_table $table)" != "t" ]; then
    echo "   ❌ Missing table: $table" >&2
    MISSING_TABLES="$MISSING_TABLES $table"
  else
    echo "   ✅ Table exists: $table" >&2
  fi
done

# Check relationship tables
echo "📋 Checking relationship tables..." >&2

REL_TABLES="posts_internal_links_metadata_links_added posts_affiliate_links_metadata_links_added posts_populated_authors"
for table in $REL_TABLES; do
  if [ "$(check_table $table)" != "t" ]; then
    echo "   ❌ Missing table: $table" >&2
    MISSING_TABLES="$MISSING_TABLES $table"
  else
    echo "   ✅ Table exists: $table" >&2
  fi
done

# Check critical columns in posts table
echo "📋 Checking posts table columns..." >&2

REQUIRED_COLUMNS="_status language title slug content excerpt
wordpress_metadata_status wordpress_metadata_original_author wordpress_metadata_original_date
wordpress_metadata_modified_date wordpress_metadata_enable_comments wordpress_metadata_enable_toc
internal_links_metadata_version internal_links_metadata_last_processed internal_links_metadata_content_hash
affiliate_links_metadata_version affiliate_links_metadata_last_processed affiliate_links_metadata_content_hash
affiliate_links_metadata_exclude_from_affiliates
content_db_meta_original_id content_db_meta_website_id content_db_meta_language content_db_meta_imported_at
hero_image_id hero_image_alt meta_title meta_description meta_keywords meta_focus_keyphrase"

MISSING_COLUMNS=""
for column in $REQUIRED_COLUMNS; do
  if [ "$(check_column posts "$column")" != "t" ]; then
    echo "   ❌ Missing column: posts.$column" >&2
    MISSING_COLUMNS="$MISSING_COLUMNS $column"
  fi
done

if [ -n "$MISSING_COLUMNS" ]; then
  echo "   ✅ Found columns, missing: $MISSING_COLUMNS" >&2
else
  echo "   ✅ All required columns exist!" >&2
fi

# Check media table columns
echo "📋 Checking media table columns..." >&2

MEDIA_COLUMNS="prefix _key focal_x focal_y thumbnail_u_r_l filename url width height"
for column in $MEDIA_COLUMNS; do
  if [ "$(check_column media "$column")" != "t" ]; then
    echo "   ⚠️ Missing column: media.$column" >&2
  fi
done

# Check posts_rels columns
echo "📋 Checking posts_rels table columns..." >&2

if [ "$(check_column posts_rels "order")" != "t" ]; then
  echo "   ⚠️ Missing column: posts_rels.order" >&2
fi

# Summary
echo "" >&2
echo "📊 VALIDATION SUMMARY:" >&2

# Count tables
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
echo "   Total tables: $TABLE_COUNT" >&2

# Count posts
POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts WHERE _status IS NOT NULL;" 2>/dev/null || echo "0")
echo "   Total posts: $POST_COUNT" >&2

# Count media
MEDIA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")
echo "   Total media: $MEDIA_COUNT" >&2

# Check _status values
STATUS_VALUES=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT DISTINCT _status FROM posts LIMIT 5;" 2>/dev/null | tr '\n' ' ')
echo "   Post status values: $STATUS_VALUES" >&2

# Final check
if [ -n "$MISSING_TABLES$MISSING_COLUMNS" ]; then
  echo "" >&2
  echo "❌ SCHEMA VALIDATION FAILED!" >&2
  echo "Missing components detected. Database may not be ready." >&2
  exit 1
else
  echo "" >&2
  echo "✅ SCHEMA VALIDATION PASSED!" >&2
  echo "Database is ready for Payload CMS." >&2
  exit 0
fi