#!/bin/sh
# Removed set -e to prevent early exit on errors

# Write to stderr to ensure visibility
echo "=========================================" >&2
echo "Docker Container Starting..." >&2
echo "=========================================" >&2
echo "DEBUG: Script has started running!" >&2
echo "Node version: $(node --version 2>/dev/null || echo 'node not found')"
echo "Current directory: $(pwd 2>/dev/null || echo 'pwd failed')"
echo "Files in current directory:"
ls -la 2>/dev/null || echo "ls failed"

echo ""
echo "Environment Variables Check:"
echo "----------------------------"
echo "DATABASE_URI is set: $([ -n "$DATABASE_URI" ] && echo 'Yes ✓' || echo 'No ✗')"
echo "PAYLOAD_SECRET is set: $([ -n "$PAYLOAD_SECRET" ] && echo 'Yes ✓' || echo 'No ✗')"
echo "NEXT_PUBLIC_SERVER_URL: ${NEXT_PUBLIC_SERVER_URL:-'Not set'}"
echo "NODE_ENV: ${NODE_ENV:-'Not set'}"
echo "PORT: ${PORT:-'Not set'}"

# Check if DATABASE_URI is set
if [ -z "$DATABASE_URI" ]; then
  echo ""
  echo "❌ ERROR: DATABASE_URI environment variable is not set!"
  echo "Please set DATABASE_URI in Dokploy environment variables."
  echo "Example: postgresql://postgres:2801@webblog-kawaiibirddb-gq00ip:5432/kawaii-bird-db"
  exit 1
fi

# Check if PAYLOAD_SECRET is set
if [ -z "$PAYLOAD_SECRET" ]; then
  echo ""
  echo "❌ ERROR: PAYLOAD_SECRET environment variable is not set!"
  echo "Please set PAYLOAD_SECRET in Dokploy environment variables."
  exit 1
fi

# Parse DATABASE_URI to get connection details FIRST
if [ -n "$DATABASE_URI" ]; then
  # Extract components from postgresql://user:pass@host:port/dbname
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# Log sanitized DATABASE_URI (hide password)
SANITIZED_DB_URI=$(echo "$DATABASE_URI" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/****:****@/')
echo ""
echo "Database URI (sanitized): $SANITIZED_DB_URI"

echo ""
echo "Database connection parsed:"
echo "- Host: $DB_HOST"
echo "- Port: $DB_PORT"
echo "- Database: $DB_NAME"
echo "- User: $DB_USER"
echo "- Password exists: $([ -n "$DB_PASSWORD" ] && echo 'Yes' || echo 'No')"

# Export variables explicitly for the Node.js process
export DATABASE_URI
export PAYLOAD_SECRET
export NEXT_PUBLIC_SERVER_URL
export NODE_ENV
export PORT
export PAYLOAD_CONFIG_PATH=dist/payload.config.js

# List files to debug
echo "🔍 Current directory contents:" >&2
ls -la >&2

# QUICK IMPORT - Drop everything and recreate from scratch
echo "🚀 ATTEMPTING QUICK IMPORT..." >&2
echo "🔍 Checking for quick-import.sql..." >&2
if [ -f quick-import.sql ]; then
  echo "✅ Found quick-import.sql! Executing..." >&2
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f quick-import.sql 2>&1
  echo "✅ Quick import executed" >&2

  # Verify tables were created
  TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)
  echo "📊 Database now has $TABLE_COUNT tables" >&2

  POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>&1)
  echo "📝 Database now has $POST_COUNT posts" >&2
else
  echo "❌ quick-import.sql NOT FOUND in current directory!" >&2
  echo "📂 Files in current directory:" >&2
  ls -la *.sql 2>&1 >&2 || echo "No .sql files found" >&2

  # Fallback to old method
  if [ -f init-database-schema.sql ]; then
    echo "📋 Found init-database-schema.sql, using as fallback..." >&2
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f init-database-schema.sql 2>&1
    echo "📋 Schema initialization complete" >&2
  else
    echo "❌ No SQL files found at all!" >&2
  fi
fi

# Verify tables and import data immediately
TABLE_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
echo "✅ Database has $TABLE_CHECK tables" >&2

# Force import data right now!
echo "📝 FORCING data import..." >&2
if [ -f import-production-data.sh ]; then
  chmod +x import-production-data.sh
  sh import-production-data.sh 2>&1 || true
fi

# Check if we should force initialize the database
# NOTE: This runs AFTER our schema initialization
if [ "$FORCE_DB_INIT" = "true" ]; then
  echo "FORCE_DB_INIT is set, reinitializing database..."
  if [ -f force-init-db.sh ]; then
    sh force-init-db.sh || echo "Force init completed or failed"
  fi
elif [ -f init-db.sh ]; then
  echo "Running database initialization check..."
  sh init-db.sh || echo "Database init failed or not needed, continuing..."
fi

echo ""
echo "========================================="
echo "Starting Next.js server on port ${PORT:-3000}..."
echo "========================================="
echo ""

# No longer need background check - everything is done upfront by quick-import.sql

# Initialize bird theme content if requested
if [ "$INIT_BIRD_THEME" = "true" ]; then
  echo ""
  echo "🦜 Initializing Kawaii Bird theme content..."
  if [ -f init-bird-production.sh ]; then
    sh init-bird-production.sh || echo "Bird theme initialization completed or failed"
  fi
fi

# Check if we need to use the simple server or the full app
if [ "$USE_SIMPLE_SERVER" = "true" ]; then
  echo "Using simple diagnostic server..."
  exec node simple-server.cjs
else
  echo "Starting main Next.js application..."
  # Skip wrapper, run server.js directly (it's the Next.js standalone output)
  exec node server.js
fi