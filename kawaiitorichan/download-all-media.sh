#!/bin/sh
# Download all media files from GitHub
# Run this INSIDE the Dokploy container

echo "📥 Downloading all media files from GitHub..."
echo "This will take a few minutes..."

# Create media directory
mkdir -p public/media
cd public/media

# Base URL for your GitHub repo
BASE_URL="https://raw.githubusercontent.com/builequan/kawaiismallbird/master/kawaiitorichan/public/media"

# List of main image files (just the primary ones, not size variations)
# You can get this list from your database
psql $DATABASE_URI -tAc "SELECT DISTINCT filename FROM media WHERE filename IS NOT NULL AND filename NOT LIKE '%-300x300%' AND filename NOT LIKE '%-500x500%' AND filename NOT LIKE '%-600x600%' AND filename NOT LIKE '%-900x900%' AND filename NOT LIKE '%-1200x630%'" | while read filename; do
    if [ -n "$filename" ]; then
        echo "Downloading: $filename"
        wget -q "$BASE_URL/$filename" -O "$filename" 2>/dev/null

        if [ -f "$filename" ]; then
            echo "✅ $filename"
        else
            echo "❌ Failed: $filename"
        fi
    fi
done

# Count results
TOTAL=$(ls -1 *.jpg *.png *.gif *.webp 2>/dev/null | wc -l)
echo ""
echo "✅ Downloaded $TOTAL media files"
echo "📁 Files are in: $(pwd)"

# Test by checking a sample post's image
echo ""
echo "Testing media display..."
SAMPLE_IMAGE=$(psql $DATABASE_URI -tAc "SELECT filename FROM media LIMIT 1")
if [ -f "$SAMPLE_IMAGE" ]; then
    echo "✅ Sample image exists: $SAMPLE_IMAGE"
else
    echo "⚠️ Sample image not found: $SAMPLE_IMAGE"
fi