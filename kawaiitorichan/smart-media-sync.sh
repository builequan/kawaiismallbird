#!/bin/sh
# Smart Media Sync - Downloads only missing media files from GitHub
# Handles all edge cases: first deployment, new imports, manual uploads

echo "🔍 Smart Media Sync - Checking media files..."

# Parse database URL
if [ -z "$DATABASE_URI" ]; then
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create media directory if it doesn't exist
mkdir -p /app/public/media
cd /app/public/media

# Get total media count from database
TOTAL_DB=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM media WHERE filename IS NOT NULL;" 2>/dev/null || echo "0")

if [ "$TOTAL_DB" -eq "0" ]; then
  echo "ℹ️  No media records in database, skipping sync"
  exit 0
fi

echo "📊 Database has $TOTAL_DB media records"

# Count existing files
EXISTING_COUNT=$(find /app/public/media -type f 2>/dev/null | wc -l | tr -d ' ')
echo "📁 Local filesystem has $EXISTING_COUNT files"

# If all files exist, skip download
if [ "$EXISTING_COUNT" -ge "$TOTAL_DB" ]; then
  echo "✅ All media files already present, skipping download"
  exit 0
fi

echo "📥 Downloading missing media files from GitHub..."
echo "   Missing: $((TOTAL_DB - EXISTING_COUNT)) files"

# Create temp file with filenames
TEMP_FILE="/tmp/media-files-$$.txt"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tA -c "SELECT filename FROM media WHERE filename IS NOT NULL ORDER BY id;" > "$TEMP_FILE"

# Download missing files
COUNT=0
DOWNLOADED=0
SKIPPED=0
FAILED=0

# Read from temp file instead of pipe
while IFS= read -r filename; do
  if [ -n "$filename" ]; then
    COUNT=$((COUNT + 1))

    # Show progress every 50 files
    if [ $((COUNT % 50)) -eq 0 ] || [ $COUNT -eq 1 ]; then
      echo "Progress: $COUNT/$TOTAL_DB files checked..."
    fi

    # Check if file already exists
    if [ -f "$filename" ]; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    # Download missing file
    GITHUB_URL="https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/public/media/$filename"

    if command -v wget > /dev/null 2>&1; then
      wget -q -O "$filename" "$GITHUB_URL" 2>/dev/null
    elif command -v curl > /dev/null 2>&1; then
      curl -sL -o "$filename" "$GITHUB_URL" 2>/dev/null
    else
      echo "❌ Neither wget nor curl available"
      rm -f "$TEMP_FILE"
      exit 1
    fi

    # Check if download succeeded
    if [ -f "$filename" ] && [ -s "$filename" ]; then
      DOWNLOADED=$((DOWNLOADED + 1))
    else
      FAILED=$((FAILED + 1))
      rm -f "$filename" 2>/dev/null  # Remove empty file
    fi
  fi
done < "$TEMP_FILE"

# Clean up temp file
rm -f "$TEMP_FILE"

# Final count
FINAL_COUNT=$(find /app/public/media -type f 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "✅ Smart Media Sync Complete!"
echo "   📊 Database records: $TOTAL_DB"
echo "   📁 Local files: $FINAL_COUNT"
echo "   ⬇️  Downloaded: $DOWNLOADED"
echo "   ⏭️  Skipped (existing): $SKIPPED"
if [ "$FAILED" -gt "0" ]; then
  echo "   ⚠️  Failed: $FAILED"
fi

cd /app
exit 0