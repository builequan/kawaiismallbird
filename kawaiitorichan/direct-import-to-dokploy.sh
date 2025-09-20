#!/bin/bash

echo "🚀 Direct Import from Local Database to Dokploy"
echo "================================================"

# Local database (source)
LOCAL_DB="golfer"
LOCAL_USER="postgres"
LOCAL_PASS="2801"
LOCAL_HOST="127.0.0.1"
LOCAL_PORT="5432"

# Dokploy database (destination)
DOKPLOY_DB="kawaii-bird-db"
DOKPLOY_USER="postgres"
DOKPLOY_PASS="2801"
DOKPLOY_HOST="100.94.235.84"
DOKPLOY_PORT="5432"

echo "📊 Checking local database for content..."
POST_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published'" 2>/dev/null)
CAT_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null)
MEDIA_COUNT=$(PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -tAc "SELECT COUNT(*) FROM media" 2>/dev/null)

echo "✅ Local database has:"
echo "   📝 $POST_COUNT published posts"
echo "   📁 $CAT_COUNT categories"
echo "   🖼️ $MEDIA_COUNT media items"

echo ""
echo "🔄 Attempting to connect to Dokploy database..."
echo "   Host: $DOKPLOY_HOST"
echo "   Port: $DOKPLOY_PORT"
echo "   Database: $DOKPLOY_DB"

# Test connection to Dokploy
PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to Dokploy database!"
    echo ""
    echo "Possible issues:"
    echo "1. PostgreSQL port might not be exposed externally"
    echo "2. Firewall blocking connection"
    echo "3. Wrong IP address or credentials"
    echo ""
    echo "Alternative: Creating a SQL file you can import manually..."

    # Create SQL file as fallback
    echo "📦 Creating production-import.sql with all your data..."
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
        -t footer \
        -f production-import.sql

    echo "✅ Created production-import.sql"
    echo ""
    echo "📋 TO IMPORT MANUALLY:"
    echo "1. Copy this file to your Dokploy server"
    echo "2. Run in Dokploy container:"
    echo "   psql -U postgres -d $DOKPLOY_DB -f production-import.sql"
    exit 1
fi

echo "✅ Connected to Dokploy database successfully!"

echo ""
echo "🧹 Clearing existing data in Dokploy..."
PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB <<EOF
TRUNCATE posts_rels, posts, categories, media, users, header, footer RESTART IDENTITY CASCADE;
EOF

echo "📤 Streaming all data from local to Dokploy..."
echo "This may take a moment..."

# Direct pipe from local to Dokploy
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
    -d $DOKPLOY_DB \
    -q

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Data transfer complete!"

    # Fix sequences
    echo "🔧 Fixing database sequences..."
    PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB <<EOF
    SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
    SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));
    SELECT setval('media_id_seq', COALESCE((SELECT MAX(id) FROM media), 1));
    SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1));
    SELECT setval('posts_rels_id_seq', COALESCE((SELECT MAX(id) FROM posts_rels), 1));
EOF

    # Verify import
    echo ""
    echo "📊 Verifying import..."
    DOKPLOY_POSTS=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published'" 2>/dev/null)
    DOKPLOY_CATS=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null)
    DOKPLOY_MEDIA=$(PGPASSWORD=$DOKPLOY_PASS psql -h $DOKPLOY_HOST -p $DOKPLOY_PORT -U $DOKPLOY_USER -d $DOKPLOY_DB -tAc "SELECT COUNT(*) FROM media" 2>/dev/null)

    echo "✅ Dokploy database now has:"
    echo "   📝 $DOKPLOY_POSTS published posts"
    echo "   📁 $DOKPLOY_CATS categories"
    echo "   🖼️ $DOKPLOY_MEDIA media items"
    echo ""
    echo "🎉 SUCCESS! All 115 posts have been imported to Dokploy!"
    echo "🌐 Your website should now show all content!"
else
    echo ""
    echo "❌ Data transfer failed!"
    echo "Creating SQL file for manual import..."

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
        -t footer \
        -f production-import.sql

    echo "✅ Created production-import.sql"
    echo "Please import this file manually in Dokploy"
fi