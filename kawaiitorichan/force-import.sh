#!/bin/sh
# Simplified force import - uses quick-import.sql only

echo "🚀 FORCE IMPORTING DATA TO KAWAII BIRD DATABASE"
echo "=============================================="

# Parse DATABASE_URI to get connection details
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "Database connection:"
  echo "  Host: $PGHOST"
  echo "  Port: $PGPORT"
  echo "  Database: $PGDATABASE"
  echo "  User: $PGUSER"
else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

# Use quick-import.sql as the primary import file
if [ ! -f quick-import.sql ]; then
  echo "⚠️ quick-import.sql not found!"
  echo "Files in current directory:"
  ls -la *.sql

  # Try essential_data.sql as fallback
  if [ -f essential_data.sql ]; then
    echo "Using essential_data.sql as fallback..."
    cp essential_data.sql quick-import.sql
  else
    exit 1
  fi
fi

echo ""
echo "📥 IMPORTING DATA NOW..."
echo "This will add posts, categories, and media to your database"
echo ""

# Force import using quick-import.sql
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f quick-import.sql 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ IMPORT SUCCESSFUL!"
  echo ""

  # Count what was imported
  POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts WHERE _status = 'published'" 2>/dev/null || echo "0")
  CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")
  MEDIA_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media" 2>/dev/null || echo "0")

  echo "📊 Database now contains:"
  echo "   Posts: $POST_COUNT"
  echo "   Categories: $CAT_COUNT"
  echo "   Media: $MEDIA_COUNT"
  echo ""
  echo "🎉 YOUR WEBSITE NOW HAS CONTENT!"
  echo "   Please refresh your browser to see the posts."
else
  echo ""
  echo "❌ Import failed. Please check the error messages above."
  echo "   You may need to clear the database first or check the connection."
fi