#!/bin/sh
# Download all media files after database import

echo "📸 Downloading media files..."

# Parse DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  # Create media directories - ensure it's in the right location
  mkdir -p /app/public/media
  mkdir -p public/media

  # Get all media files from database
  echo "📂 Fetching media list from database..." >&2
  MEDIA_LIST=$(PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tA -c "SELECT filename FROM media WHERE filename IS NOT NULL;" 2>/dev/null)

  echo "$MEDIA_LIST" | while read -r filename; do
    if [ -n "$filename" ]; then
      # Try to download from GitHub (where our source images are stored)
      GITHUB_URL="https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/public/media/$filename"

      echo "Downloading: $filename"

      # Try to save to both locations to ensure it works
      if command -v wget > /dev/null 2>&1; then
        wget -q -O "/app/public/media/$filename" "$GITHUB_URL" 2>/dev/null || echo "  ⚠️ Failed: $filename"
        cp "/app/public/media/$filename" "public/media/$filename" 2>/dev/null || true
      elif command -v curl > /dev/null 2>&1; then
        curl -sL -o "/app/public/media/$filename" "$GITHUB_URL" 2>/dev/null || echo "  ⚠️ Failed: $filename"
        cp "/app/public/media/$filename" "public/media/$filename" 2>/dev/null || true
      fi

      if [ -f "/app/public/media/$filename" ] || [ -f "public/media/$filename" ]; then
        echo "  ✅ Downloaded: $filename"
      fi
    fi
  done

  # Count downloaded files
  DOWNLOADED=$(find /app/public/media -type f 2>/dev/null | wc -l || echo "0")
  echo "📊 Downloaded $DOWNLOADED media files"

  # Fix permissions
  chmod -R 755 /app/public/media 2>/dev/null || true
  chmod -R 755 public/media 2>/dev/null || true
else
  echo "❌ DATABASE_URI not set"
fi