#!/bin/bash

# Direct export from local database to Dokploy PostgreSQL
# Streams data directly without creating large intermediate files

echo "🚀 Direct database transfer: Local → Dokploy"

# Local database credentials
LOCAL_DB="golfer"
LOCAL_USER="postgres"
LOCAL_PASS="2801"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="5432"

# Dokploy database credentials (you need to update these)
DOKPLOY_DB="kawaii-bird-db"
DOKPLOY_USER="postgres"
DOKPLOY_PASS="your-dokploy-password"  # UPDATE THIS
DOKPLOY_HOST="your-dokploy-host"  # UPDATE THIS with actual host
DOKPLOY_PORT="5432"

# Step 1: Clear existing data in Dokploy (optional, comment out if you want to keep existing data)
echo "🧹 Clearing existing data in Dokploy..."
PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB <<EOF
TRUNCATE posts_rels, posts, categories, media, users, header, footer RESTART IDENTITY CASCADE;
EOF

# Step 2: Stream data directly from local to Dokploy
echo "📤 Streaming data directly to Dokploy (no intermediate files)..."

# Export and import in one pipeline - no file created!
PGPASSWORD=$LOCAL_PASS pg_dump \
  -h $LOCAL_HOST \
  -p $LOCAL_PORT \
  -U $LOCAL_USER \
  -d $LOCAL_DB \
  --data-only \
  --no-owner \
  --no-privileges \
  -t users \
  -t categories \
  -t media \
  -t posts \
  -t posts_rels \
  -t header \
  -t footer | \
PGPASSWORD=$DOKPLOY_PASS psql \
  -h $DOKPLOY_HOST \
  -p $DOKPLOY_PORT \
  -U $DOKPLOY_USER \
  -d $DOKPLOY_DB

if [ $? -eq 0 ]; then
  echo "✅ Direct transfer successful!"

  # Step 3: Fix sequences to ensure new inserts work
  echo "🔧 Fixing sequences..."
  PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB <<EOF
  SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
  SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));
  SELECT setval('media_id_seq', COALESCE((SELECT MAX(id) FROM media), 1));
  SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1));
  SELECT setval('posts_rels_id_seq', COALESCE((SELECT MAX(id) FROM posts_rels), 1));
EOF

  # Step 4: Verify the import
  echo "📊 Verifying imported data..."
  POST_COUNT=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published'")
  CAT_COUNT=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM categories")
  MEDIA_COUNT=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM media")

  echo "✅ Successfully imported:"
  echo "   📝 $POST_COUNT published posts"
  echo "   📁 $CAT_COUNT categories"
  echo "   🖼️ $MEDIA_COUNT media items"
else
  echo "❌ Transfer failed"
  echo "Please check:"
  echo "1. Update DOKPLOY_PASS and DOKPLOY_HOST in this script"
  echo "2. Ensure Dokploy PostgreSQL is accessible from your machine"
  echo "3. Check if tables exist in Dokploy database"
fi

echo "🎉 Done! No large files created."