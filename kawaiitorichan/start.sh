#!/bin/sh
# Startup script with proper environment setup

echo "======================================"
echo "Starting Next.js Application"
echo "======================================"

# Set defaults if not provided
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"

echo "Configuration:"
echo "- PORT: $PORT"
echo "- HOSTNAME: $HOSTNAME"
echo "- NODE_ENV: $NODE_ENV"
echo "- DATABASE_URI: ${DATABASE_URI:+SET}"
echo "- PAYLOAD_SECRET: ${PAYLOAD_SECRET:+SET}"
echo ""

# Start the Next.js server
exec node server.js