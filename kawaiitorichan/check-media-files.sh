#!/bin/sh
# Quick script to check media files status

echo "🔍 Checking media files..."
echo ""

# Check if media directory exists
if [ -d "/app/public/media" ]; then
  FILE_COUNT=$(ls /app/public/media 2>/dev/null | wc -l | tr -d ' ')
  echo "📁 Media directory exists"
  echo "📊 Files found: $FILE_COUNT"

  # Check database count
  if [ -n "$DATABASE_URI" ]; then
    export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
    export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

    DB_MEDIA=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")
    echo "🗄️  Database records: $DB_MEDIA"

    # Calculate expected files (media records * ~6 size variants)
    EXPECTED=$((DB_MEDIA * 6))
    echo "📈 Expected files: ~$EXPECTED"

    if [ "$FILE_COUNT" -lt "$EXPECTED" ]; then
      MISSING=$((EXPECTED - FILE_COUNT))
      echo ""
      echo "⚠️  Missing approximately $MISSING files"
      echo "💡 Run smart-media-sync.sh to download missing files"
    else
      echo ""
      echo "✅ All media files appear to be present"
    fi

    # Show sample files
    echo ""
    echo "📋 Sample files:"
    ls /app/public/media | head -5

  else
    echo "⚠️  DATABASE_URI not set, can't check database count"
  fi
else
  echo "❌ Media directory /app/public/media does not exist!"
  echo "💡 Create it with: mkdir -p /app/public/media"
fi

echo ""
echo "🔗 To download missing media files, run:"
echo "   sh /app/smart-media-sync.sh"
