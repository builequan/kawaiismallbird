#!/bin/sh
# Production initialization script for bird theme (uses SQL directly)

echo "🦜 Initializing Kawaii Bird Production Content..."

# Parse database URL
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "📊 Applying bird content to database..."
  echo "   Host: $PGHOST"
  echo "   Database: $PGDATABASE"

  # TRY QUICK IMPORT FIRST FOR CLEAN SETUP WITH SAMPLE DATA
  if [ -f quick-import.sql ]; then
    echo "🚀 RUNNING QUICK IMPORT - Creating tables and sample posts..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f quick-import.sql 2>&1

    # Check if it worked
    POST_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
    CAT_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")

    if [ "$POST_COUNT" -gt "0" ]; then
      echo "✅ QUICK IMPORT SUCCESS: $POST_COUNT posts, $CAT_COUNT categories created!"
      echo "🌐 Kawaii Bird production initialization complete!"
      exit 0
    else
      echo "⚠️ Quick import didn't create posts, falling back to regular initialization..."
    fi
  else
    echo "📁 Current directory files:"
    ls -la *.sql 2>&1 || echo "No SQL files found"
  fi

  # Run SQL script - try full content first, fallback to basic
  if [ -f init-full-bird-content.sql ]; then
    echo "📝 Using full bird content initialization..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f init-full-bird-content.sql

    if [ $? -eq 0 ]; then
      echo "✅ Full bird content initialized successfully!"
    else
      echo "⚠️ Failed to initialize full bird content (may already exist)"
    fi
  elif [ -f init-bird-content.sql ]; then
    echo "📝 Using basic bird content initialization..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f init-bird-content.sql

    if [ $? -eq 0 ]; then
      echo "✅ Basic bird content initialized successfully!"
    else
      echo "⚠️ Failed to initialize bird content (may already exist)"
    fi
  else
    echo "❌ No SQL initialization scripts found"
  fi
else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

echo "🌐 Kawaii Bird production initialization complete!"