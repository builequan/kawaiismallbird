#!/bin/sh
# Test script to check if posts exist in Dokploy database

echo "🔍 Testing Dokploy Database Connection..."
echo ""

if [ -z "$DATABASE_URI" ]; then
  echo "❌ DATABASE_URI not set!"
  echo "Usage: DATABASE_URI=postgres://user:pass@host:port/db sh test-dokploy-posts.sh"
  exit 1
fi

# Parse database URL
export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Database: $PGDATABASE"
echo "Host: $PGHOST:$PGPORT"
echo "User: $PGUSER"
echo ""

# Check if posts table exists
echo "📊 Checking database tables..."
TABLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
  echo "❌ posts table does NOT exist!"
  echo "Schema was not created properly."
  exit 1
fi

echo "✅ posts table exists"
echo ""

# Count total posts
echo "📝 Counting posts..."
TOTAL_POSTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
PUBLISHED_POSTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published';" 2>/dev/null || echo "0")
DRAFT_POSTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'draft';" 2>/dev/null || echo "0")

echo "Total posts: $TOTAL_POSTS"
echo "Published: $PUBLISHED_POSTS"
echo "Drafts: $DRAFT_POSTS"
echo ""

if [ "$TOTAL_POSTS" -eq "0" ]; then
  echo "❌ NO POSTS IN DATABASE!"
  echo "Data import failed or was skipped."
  exit 1
fi

# Show first 5 posts
echo "📄 First 5 posts:"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT id, title, _status, created_at FROM posts LIMIT 5;" 2>/dev/null

echo ""
echo "✅ Database has $TOTAL_POSTS posts total ($PUBLISHED_POSTS published)"
echo "If posts aren't showing on website, check Payload query depth and status filter."
