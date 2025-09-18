#!/bin/sh
set -e

echo "Starting application with environment variables..."
echo "DATABASE_URI is set: $([ -n "$DATABASE_URI" ] && echo 'Yes' || echo 'No')"
echo "PAYLOAD_SECRET is set: $([ -n "$PAYLOAD_SECRET" ] && echo 'Yes' || echo 'No')"
echo "NEXT_PUBLIC_SERVER_URL: ${NEXT_PUBLIC_SERVER_URL}"

# Check if DATABASE_URI is set
if [ -z "$DATABASE_URI" ]; then
  echo "ERROR: DATABASE_URI environment variable is not set!"
  exit 1
fi

# Check if PAYLOAD_SECRET is set
if [ -z "$PAYLOAD_SECRET" ]; then
  echo "ERROR: PAYLOAD_SECRET environment variable is not set!"
  exit 1
fi

echo "Starting Next.js server..."
exec node server.js