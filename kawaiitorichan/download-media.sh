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

  # Create media directories
  mkdir -p public/media

  # Get all media files from database
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tA <<EOF | while IFS='|' read -r filename url; do
SELECT filename, url FROM media WHERE filename IS NOT NULL;
EOF
    if [ -n "$filename" ]; then
      # Try to download from GitHub (where our source images are stored)
      GITHUB_URL="https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/public/media/$filename"

      echo "Downloading: $filename"

      if command -v wget > /dev/null 2>&1; then
        wget -q -O "public/media/$filename" "$GITHUB_URL" 2>/dev/null || echo "  ⚠️ Failed: $filename"
      elif command -v curl > /dev/null 2>&1; then
        curl -sL -o "public/media/$filename" "$GITHUB_URL" 2>/dev/null || echo "  ⚠️ Failed: $filename"
      fi

      if [ -f "public/media/$filename" ]; then
        echo "  ✅ Downloaded: $filename"
      fi
    fi
  done

  # Count downloaded files
  DOWNLOADED=$(find public/media -type f | wc -l)
  echo "📊 Downloaded $DOWNLOADED media files"

  # Fix permissions
  chmod -R 755 public/media
else
  echo "❌ DATABASE_URI not set"
fi