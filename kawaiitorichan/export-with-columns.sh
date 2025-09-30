#!/bin/bash
# Export database with column names for PostgreSQL version compatibility

echo "📦 Exporting database with --column-inserts for cross-version compatibility..."

DB_NAME="golfer"
DB_USER="postgres"
DB_PASSWORD="2801"
DB_HOST="host.docker.internal"
DB_PORT="5432"

# Check database contents
export PGPASSWORD=$DB_PASSWORD
POST_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM posts;")
MEDIA_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM media;")
CATEGORY_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM categories;")

echo "  Posts: $POST_COUNT"
echo "  Media: $MEDIA_COUNT"
echo "  Categories: $CATEGORY_COUNT"

echo ""
echo "🔄 Running pg_dump with --column-inserts via Docker (PostgreSQL 17)..."

# Run pg_dump with column names
docker run --rm \
  -e PGPASSWORD=$DB_PASSWORD \
  postgres:17 \
  pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-privileges \
    --column-inserts \
    --data-only \
    --disable-triggers \
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
  > production-data-494-posts-with-columns.sql

if [ $? -eq 0 ]; then
  # Remove any INSERT INTO users statements
  grep -v "^INSERT INTO users " production-data-494-posts-with-columns.sql > temp.sql
  mv temp.sql production-data-494-posts-with-columns.sql

  echo "✅ Database exported successfully!"

  # Add header
  echo "-- Production database dump with COLUMN NAMES - ${POST_COUNT} posts" | cat - production-data-494-posts-with-columns.sql > temp && mv temp production-data-494-posts-with-columns.sql

  ls -lh production-data-494-posts-with-columns.sql

  echo "🗜️ Compressing..."
  gzip -f production-data-494-posts-with-columns.sql

  FILESIZE=$(ls -lh production-data-494-posts-with-columns.sql.gz | awk '{print $5}')
  echo "✅ Compressed to production-data-494-posts-with-columns.sql.gz ($FILESIZE)"

  # Remove old file and rename new one
  echo "🔄 Replacing old dump file..."
  rm -f production-data-494-posts.sql.gz
  mv production-data-494-posts-with-columns.sql.gz production-data-494-posts.sql.gz

  echo ""
  echo "✅ SUCCESS! New file ready for deployment:"
  ls -lh production-data-494-posts.sql.gz

  echo ""
  echo "📋 Next steps:"
  echo "1. git add production-data-494-posts.sql.gz"
  echo "2. git commit -m 'Update database dump with column names for PostgreSQL compatibility'"
  echo "3. git push origin master"
  echo "4. Redeploy on Dokploy"
else
  echo "❌ Export failed!"
  exit 1
fi
