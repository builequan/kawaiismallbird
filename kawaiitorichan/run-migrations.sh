#!/bin/sh
set -e

echo "🔄 Migration runner starting..."

# Wait for app to be ready
sleep 10

# Export required environment variables
export DATABASE_URI=${DATABASE_URI}
export PAYLOAD_SECRET=${PAYLOAD_SECRET}
export NODE_ENV=${NODE_ENV}
export PAYLOAD_CONFIG_PATH=dist/payload.config.js

# Try to run migrations
echo "📦 Running Payload migrations..."
if [ -f "./node_modules/.bin/payload" ]; then
  echo "Using local payload CLI..."
  ./node_modules/.bin/payload migrate 2>&1
elif command -v npx >/dev/null 2>&1; then
  echo "Using npx..."
  npx payload migrate 2>&1
else
  echo "⚠️ Cannot run migrations - no payload CLI available"
fi

echo "✅ Migration runner completed"