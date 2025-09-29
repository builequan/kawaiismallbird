#!/bin/sh
# Runtime environment variable replacement for NEXT_PUBLIC_SERVER_URL
# This replaces hardcoded localhost:3000 in built JavaScript files with the actual server URL

echo "🔧 Running runtime environment variable replacement..."

if [ -z "$NEXT_PUBLIC_SERVER_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_SERVER_URL not set, skipping replacement"
  exit 0
fi

# Extract just the domain from the URL (remove http://)
DOMAIN_WITH_PORT=$(echo "$NEXT_PUBLIC_SERVER_URL" | sed 's|^https\?://||')

echo "📝 Replacing localhost:3000 with:"
echo "   Full URL: $NEXT_PUBLIC_SERVER_URL"
echo "   Domain: $DOMAIN_WITH_PORT"

# Count files before replacement
TOTAL_FILES=$(find /app/.next -type f -name "*.js" | wc -l)
echo "📊 Found $TOTAL_FILES JavaScript files to process"

# Replace in all .js files in .next/static directory (client-side bundles)
echo "🔄 Processing client bundles in .next/static..."
find /app/.next/static -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do
  # Replace http://localhost:3000 with full URL
  sed -i "s|http://localhost:3000|$NEXT_PUBLIC_SERVER_URL|g" "$file"
  # Replace just localhost:3000 with domain
  sed -i "s|localhost:3000|$DOMAIN_WITH_PORT|g" "$file"
done

# Also process server files in .next/server
echo "🔄 Processing server bundles in .next/server..."
find /app/.next/server -type f -name "*.js" -print0 | while IFS= read -r -d '' file; do
  sed -i "s|http://localhost:3000|$NEXT_PUBLIC_SERVER_URL|g" "$file"
  sed -i "s|localhost:3000|$DOMAIN_WITH_PORT|g" "$file"
done

# Also check standalone server.js
if [ -f /app/server.js ]; then
  echo "🔄 Processing standalone server.js..."
  sed -i "s|http://localhost:3000|$NEXT_PUBLIC_SERVER_URL|g" /app/server.js
  sed -i "s|localhost:3000|$DOMAIN_WITH_PORT|g" /app/server.js
fi

# Verify replacement worked by checking a sample file
echo "🔍 Verifying replacements..."
SAMPLE_FILE=$(find /app/.next/static -name "*.js" | head -1)
if [ -n "$SAMPLE_FILE" ]; then
  if grep -q "localhost:3000" "$SAMPLE_FILE"; then
    echo "⚠️  Warning: localhost:3000 still found in some files!"
  else
    echo "✅ Replacement verified - no localhost:3000 found in sample"
  fi
fi

echo "✅ Runtime environment replacement complete!"