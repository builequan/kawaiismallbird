#!/bin/bash
# Export production data using COPY command (works with any PostgreSQL version)

echo "📦 Exporting production database via psql..."

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

# Create output file
OUTPUT_FILE="production-data-${POST_COUNT}-posts.sql"
echo "-- Production database dump with ${POST_COUNT} posts" > $OUTPUT_FILE
echo "-- Generated: $(date)" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Add TRUNCATE statements
echo "🧹 Adding TRUNCATE statements..."
cat >> $OUTPUT_FILE <<'EOF'
-- Clear existing data
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

EOF

# Export each table
echo "📤 Exporting categories..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\COPY categories TO STDOUT" | while IFS=$'\t' read -r line; do
  echo "$line" | awk -F'\t' '{
    printf "INSERT INTO categories (id, title, slug, description, \"order\", slug_lock, parent_id, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);\n",
      $1,
      ($2 == "" || $2 == "\\N" ? "NULL" : "'"'"'" $2 "'"'"'"),
      ($3 == "" || $3 == "\\N" ? "NULL" : "'"'"'" $3 "'"'"'"),
      ($4 == "" || $4 == "\\N" ? "NULL" : "'"'"'" $4 "'"'"'"),
      ($5 == "" || $5 == "\\N" ? "0" : $5),
      ($6 == "" || $6 == "\\N" ? "true" : $6),
      ($7 == "" || $7 == "\\N" ? "NULL" : $7),
      ($8 == "" || $8 == "\\N" ? "NOW()" : "'"'"'" $8 "'"'"'"),
      ($9 == "" || $9 == "\\N" ? "NOW()" : "'"'"'" $9 "'"'"'")
  }'
done >> $OUTPUT_FILE

echo "" >> $OUTPUT_FILE
echo "📤 Exporting media ($MEDIA_COUNT records)..."
echo "-- Media data ($MEDIA_COUNT records)" >> $OUTPUT_FILE
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
  SELECT 'INSERT INTO media (id, filename, url, alt, caption, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    COALESCE('''' || REPLACE(filename, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(url, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(alt, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(caption, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ');'
  FROM media;
" >> $OUTPUT_FILE

echo "" >> $OUTPUT_FILE
echo "📤 Exporting posts ($POST_COUNT records - this may take a while)..."
echo "-- Posts data ($POST_COUNT records)" >> $OUTPUT_FILE

# Use simpler COPY-based export for large JSONB content
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /tmp/posts_export.txt <<'EOSQL'
\COPY (
  SELECT
    'INSERT INTO posts (id, title, slug, excerpt, content, language, hero_image_id, hero_image_alt, meta_title, meta_description, _status, published_at, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    COALESCE('''' || REPLACE(title, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(slug, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(excerpt, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(content::text, '''', '''''') || '''::jsonb', 'NULL') || ', ' ||
    COALESCE('''' || language || '''', '''ja''') || ', ' ||
    COALESCE(hero_image_id::text, 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(hero_image_alt, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(meta_title, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || REPLACE(meta_description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || _status || '''', '''published''') || ', ' ||
    COALESCE('''' || published_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NOW()') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NOW()') ||
    ');'
  FROM posts
  ORDER BY id
) TO STDOUT
EOSQL

cat /tmp/posts_export.txt >> $OUTPUT_FILE
rm /tmp/posts_export.txt

echo "" >> $OUTPUT_FILE
echo "📤 Exporting post relationships..."
echo "-- Post relationships" >> $OUTPUT_FILE
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "
  SELECT 'INSERT INTO posts_rels (id, parent_id, \"order\", path, categories_id, tags_id, posts_id, users_id) VALUES (' ||
    id || ', ' ||
    COALESCE(parent_id::text, 'NULL') || ', ' ||
    COALESCE(\"order\"::text, '0') || ', ' ||
    COALESCE('''' || path || '''', 'NULL') || ', ' ||
    COALESCE(categories_id::text, 'NULL') || ', ' ||
    COALESCE(tags_id::text, 'NULL') || ', ' ||
    COALESCE(posts_id::text, 'NULL') || ', ' ||
    COALESCE(users_id::text, 'NULL') ||
    ');'
  FROM posts_rels;
" >> $OUTPUT_FILE

echo "✅ Database exported to $OUTPUT_FILE"
ls -lh $OUTPUT_FILE

echo "🗜️ Compressing..."
gzip -f $OUTPUT_FILE
FILESIZE=$(ls -lh ${OUTPUT_FILE}.gz | awk '{print $5}')
echo "✅ Compressed to ${OUTPUT_FILE}.gz ($FILESIZE)"

echo ""
echo "📋 Next steps:"
echo "1. git add ${OUTPUT_FILE}.gz"
echo "2. git commit -m 'Add production database with ${POST_COUNT} posts and ${MEDIA_COUNT} media files'"
echo "3. git push origin master"
echo "4. Update init-bird-production.sh to use new file"
echo "5. Redeploy on Dokploy"
