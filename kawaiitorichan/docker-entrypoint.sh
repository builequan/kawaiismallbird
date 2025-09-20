#!/bin/sh
set -e

echo "========================================="
echo "Docker Container Starting..."
echo "========================================="
echo "Node version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

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

# Export variables explicitly for the Node.js process
export DATABASE_URI
export PAYLOAD_SECRET
export NEXT_PUBLIC_SERVER_URL
export NODE_ENV
export PORT
export PAYLOAD_CONFIG_PATH=dist/payload.config.js

# Run migrations in background after app starts
if [ -f run-migrations.sh ]; then
  chmod +x run-migrations.sh
  (
    echo "📦 Starting migration runner in background..."
    ./run-migrations.sh 2>&1
  ) &
fi

echo ""
echo "========================================="
echo "Starting Next.js server on port ${PORT:-3000}..."
echo "========================================="
echo ""

# Check if we should force initialize the database
if [ "$FORCE_DB_INIT" = "true" ]; then
  echo "FORCE_DB_INIT is set, reinitializing database..."
  if [ -f force-init-db.sh ]; then
    sh force-init-db.sh || echo "Force init completed or failed"
  fi
elif [ -f init-db.sh ]; then
  echo "Running database initialization check..."
  sh init-db.sh || echo "Database init failed or not needed, continuing..."
fi

# Function to import data after tables are created
import_data_if_needed() {
  echo "🔍 Checking if data import is needed..."

  # Check if posts table exists and count posts
  TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts');" 2>/dev/null || echo "f")

  if [ "$TABLE_EXISTS" = "t" ]; then
    POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
    POST_COUNT=$(echo $POST_COUNT | tr -d ' ')

    if [ "$POST_COUNT" = "0" ] || [ -z "$POST_COUNT" ]; then
      echo "📝 No posts found. Importing production data..."

      if [ -f import-production-data.sh ]; then
        chmod +x import-production-data.sh
        sh import-production-data.sh

        NEW_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
        echo "✅ Imported $NEW_COUNT posts"
      fi
    else
      echo "✅ Found $POST_COUNT posts in database"
    fi
  else
    echo "⏳ Posts table not ready yet"
    return 1
  fi
}

# Start the import checker in background
(
  echo "⏳ Waiting for tables to be created..."
  sleep 15  # Give the app time to start and create tables

  # Try to import data up to 10 times with 5 second intervals
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if import_data_if_needed; then
      echo "✅ Data import check complete"
      break
    fi
    echo "⏳ Attempt $i/10: Waiting for tables..."
    sleep 5
  done
) &

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