#!/bin/sh
# Download all media files in Docker container
# Run this INSIDE Dokploy container

echo "📥 Downloading all media files from GitHub..."
echo "This will download 347 images (about 78MB)"

# Go to correct directory
cd /app
mkdir -p public/media
cd public/media

# Get all media files from database
COUNT=0
SUCCESS=0
FAILED=0

echo "Starting download..."

# Download all files from database
psql $DATABASE_URI -tAc "SELECT DISTINCT filename FROM media WHERE filename IS NOT NULL ORDER BY filename" | while read filename; do
    if [ -n "$filename" ]; then
        COUNT=$((COUNT + 1))

        # Download from GitHub
        if wget -q "https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/public/media/$filename" 2>/dev/null; then
            SUCCESS=$((SUCCESS + 1))
            echo "[$COUNT] ✓ $filename"
        else
            FAILED=$((FAILED + 1))
            echo "[$COUNT] ✗ $filename (not found)"
        fi

        # Show progress every 50 files
        if [ $((COUNT % 50)) -eq 0 ]; then
            echo "Progress: $COUNT files processed..."
        fi
    fi
done

# Final report
echo ""
echo "================================"
echo "📊 Download Complete!"
echo "================================"
TOTAL=$(ls -1 *.jpg *.png 2>/dev/null | wc -l)
echo "✅ Successfully downloaded: $TOTAL files"
echo "📁 Location: /app/public/media"
echo ""
echo "Your images should now appear on the website!"