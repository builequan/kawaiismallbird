#!/bin/bash
# Export production data with all posts and media

echo "📦 Exporting production database..."

# Set database connection
DB_NAME="golfer"
DB_USER="postgres"
DB_PASSWORD="2801"
DB_HOST="127.0.0.1"
DB_PORT="5432"

export PGPASSWORD=$DB_PASSWORD

echo "📊 Checking database contents..."
POST_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM posts;")
MEDIA_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM media;")
CATEGORY_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM categories;")

echo "  Posts: $POST_COUNT"
echo "  Media: $MEDIA_COUNT"
echo "  Categories: $CATEGORY_COUNT"

echo ""
echo "🔄 Exporting database (this may take a few minutes)..."

# Export complete database dump (data only, no DROP statements)
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --no-owner \
  --no-privileges \
  --data-only \
  --column-inserts \
  --table=posts \
  --table=_posts_v \
  --table=posts_rels \
  --table=_posts_v_rels \
  --table=posts_internal_links_metadata_links_added \
  --table=posts_affiliate_links_metadata_links_added \
  --table=posts_populated_authors \
  --table=categories \
  --table=categories_breadcrumbs \
  --table=tags \
  --table=media \
  --table=payload_migrations \
  --table=payload_locked_documents \
  --table=payload_preferences \
  | sed 's/^INSERT INTO users /-- INSERT INTO users /' \
  > production-data-${POST_COUNT}-posts.sql

echo "✅ Database exported to production-data-${POST_COUNT}-posts.sql"

# Compress it
echo "🗜️ Compressing database dump..."
gzip -f production-data-${POST_COUNT}-posts.sql

FILESIZE=$(ls -lh production-data-${POST_COUNT}-posts.sql.gz | awk '{print $5}')
echo "✅ Compressed to production-data-${POST_COUNT}-posts.sql.gz ($FILESIZE)"

echo ""
echo "📋 Next steps:"
echo "1. Commit this file to git:"
echo "   git add production-data-${POST_COUNT}-posts.sql.gz"
echo "   git commit -m 'Add production database dump with ${POST_COUNT} posts'"
echo "   git push origin master"
echo ""
echo "2. Update init-bird-production.sh to use the new file"
echo "3. Redeploy on Dokploy"
