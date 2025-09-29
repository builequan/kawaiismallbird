#!/bin/sh
# Runtime environment variable replacement for NEXT_PUBLIC_SERVER_URL
# This replaces hardcoded localhost:3000 in built JavaScript files with the actual server URL

echo "🔧 Running runtime environment variable replacement..."

if [ -z "$NEXT_PUBLIC_SERVER_URL" ]; then
  echo "⚠️  NEXT_PUBLIC_SERVER_URL not set, skipping replacement"
  exit 0
fi

# Find all JavaScript files in the .next directory
echo "Replacing localhost:3000 with $NEXT_PUBLIC_SERVER_URL in built files..."

# Replace in all .js files in .next directory
find /app/.next -type f -name "*.js" -exec sed -i "s|http://localhost:3000|$NEXT_PUBLIC_SERVER_URL|g" {} \;
find /app/.next -type f -name "*.js" -exec sed -i "s|localhost:3000|${NEXT_PUBLIC_SERVER_URL#http://}|g" {} \;

echo "✅ Runtime environment replacement complete!"