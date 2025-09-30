#!/bin/bash
# Export database using Docker postgres:17 container for proper pg_dump version

echo "📦 Exporting production database using Docker..."

DB_NAME="golfer"
DB_USER="postgres"
DB_PASSWORD="2801"
DB_HOST="host.docker.internal"  # Docker's way to access host machine
DB_PORT="5432"

echo "📊 Checking database contents..."
export PGPASSWORD=$DB_PASSWORD
POST_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM posts;")
MEDIA_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM media;")
CATEGORY_COUNT=$(psql -h 127.0.0.1 -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM categories;")

echo "  Posts: $POST_COUNT"
echo "  Media: $MEDIA_COUNT"
echo "  Categories: $CATEGORY_COUNT"

echo ""
echo "🔄 Running pg_dump via Docker (PostgreSQL 17)..."

# Use Docker to run pg_dump with matching version
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
    --data-only \
    --inserts \
    --disable-triggers \
    --table=categories \
    --table=categories_breadcrumbs \
    --table=tags \
    --table=media \
    --table=posts \
    --table=posts_rels \
    --table=_posts_v \
    --table=_posts_v_rels \
    --table=posts_internal_links_metadata_links_added \
    --table=posts_affiliate_links_metadata_links_added \
    --table=posts_populated_authors \
    --table=payload_migrations \
    | grep -v "^INSERT INTO users " \
    > production-data-${POST_COUNT}-posts.sql

if [ $? -eq 0 ]; then
  echo "✅ Database exported successfully!"

  # Add header
  echo "-- Production database dump with ${POST_COUNT} posts" | cat - production-data-${POST_COUNT}-posts.sql > temp && mv temp production-data-${POST_COUNT}-posts.sql

  ls -lh production-data-${POST_COUNT}-posts.sql

  echo "🗜️ Compressing..."
  gzip -f production-data-${POST_COUNT}-posts.sql

  FILESIZE=$(ls -lh production-data-${POST_COUNT}-posts.sql.gz | awk '{print $5}')
  echo "✅ Compressed to production-data-${POST_COUNT}-posts.sql.gz ($FILESIZE)"

  echo ""
  echo "📋 Next steps:"
  echo "1. git add production-data-${POST_COUNT}-posts.sql.gz"
  echo "2. git commit -m 'Add production database with ${POST_COUNT} posts'"
  echo "3. git push origin master"
  echo "4. Redeploy on Dokploy"
else
  echo "❌ Export failed!"
  exit 1
fi
