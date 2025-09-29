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

# DATABASE INITIALIZATION - Create schema and import data
echo "🚀 INITIALIZING DATABASE..." >&2

# First, try to create schema using reset script
if [ -f reset-and-init-db.sh ]; then
  echo "🔄 Running database reset to ensure proper schema..." >&2
  chmod +x reset-and-init-db.sh
  sh reset-and-init-db.sh 2>&1 | head -50 >&2
fi

# Then import data
if [ -f quick-import.sql ]; then
  echo "📥 Importing data into database..." >&2

  # The quick-import.sql has INSERT statements for the data
  # We need to ensure _status and language have proper values
  sed "s/'published'/'published'/g; s/'ja'/'ja'/g" quick-import.sql > /tmp/data-import.sql

  IMPORT_OUTPUT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/data-import.sql 2>&1)
  IMPORT_EXIT_CODE=$?

  if [ $IMPORT_EXIT_CODE -eq 0 ]; then
    echo "✅ Data import successful!" >&2
  else
    echo "⚠️ Some warnings during data import" >&2
    echo "$IMPORT_OUTPUT" | head -20 >&2
  fi

  rm /tmp/data-import.sql
elif [ -f init-schema-and-data.sql.gz ]; then
  echo "⚠️ Using fallback init-schema-and-data.sql.gz..." >&2
  gunzip -c init-schema-and-data.sql.gz > /tmp/init-schema-and-data.sql
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/init-schema-and-data.sql 2>&1 | head -50 >&2
  rm /tmp/init-schema-and-data.sql
fi

# CRITICAL: Run failsafe to ensure _status column exists
echo "" >&2
echo "🔧 Running failsafe column check..." >&2
if [ -f ensure-status-column.sh ]; then
  chmod +x ensure-status-column.sh
  sh ensure-status-column.sh 2>&1
elif [ -f simple-status-fix.sql ]; then
  echo "⚠️ Using simple-status-fix.sql..." >&2
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f simple-status-fix.sql 2>&1 | head -20 >&2
else
  echo "⚠️ Scripts not found, trying inline fix..." >&2

  # Inline failsafe - use VARCHAR instead of ENUM for maximum compatibility
  PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -20 >&2
-- Emergency inline fix using VARCHAR (most compatible)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status VARCHAR DEFAULT 'published' NOT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'ja' NOT NULL;

-- Update any NULL values
UPDATE posts SET _status = 'published' WHERE _status IS NULL OR _status = '';
UPDATE posts SET language = 'ja' WHERE language IS NULL OR language = '';

-- Add constraints
DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (_status IN ('draft', 'published'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE posts ADD CONSTRAINT posts_language_check CHECK (language IN ('ja', 'en'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);

-- Fix media table columns (common Payload CMS issue)
ALTER TABLE media ADD COLUMN IF NOT EXISTS prefix VARCHAR DEFAULT 'media';
ALTER TABLE media ADD COLUMN IF NOT EXISTS _key VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
EOF
fi

# Double-check that _status column exists
echo "🔍 Final _status column verification..." >&2
STATUS_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts' AND column_name = '_status';" 2>/dev/null)
if [ -n "$STATUS_CHECK" ]; then
  echo "✅ _status column verified: $STATUS_CHECK" >&2
else
  echo "❌ CRITICAL: _status column still missing!" >&2
fi

# Verify database status
echo "" >&2
echo "📊 Verifying database status..." >&2
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
echo "📊 Database has $TABLE_COUNT tables" >&2

POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
echo "📝 Database has $POST_COUNT posts" >&2

MEDIA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")
echo "🖼️ Database has $MEDIA_COUNT media records" >&2

MIGRATION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM payload_migrations;" 2>/dev/null || echo "0")
echo "🔧 Database has $MIGRATION_COUNT migration records" >&2

if [ "$POST_COUNT" = "0" ]; then
  echo "❌ WARNING: No posts in database! Import may have failed." >&2
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

# Initialize bird theme content (always run to ensure data is present)
echo ""
echo "🦜 Initializing Kawaii Bird theme content..."
if [ -f init-bird-production.sh ]; then
  echo "Running init-bird-production.sh..."
  sh init-bird-production.sh
  INIT_EXIT_CODE=$?
  if [ $INIT_EXIT_CODE -eq 0 ]; then
    echo "✅ Bird theme initialization completed successfully!"
  else
    echo "⚠️ Bird theme initialization had issues but continuing..."
  fi
fi

# Check if media files exist, if not download them
echo ""
echo "🖼️ Checking media files..."
MEDIA_COUNT=$(find /app/public/media -type f 2>/dev/null | wc -l || echo "0")
if [ "$MEDIA_COUNT" -lt "100" ]; then
  echo "⚠️ Media files missing (found only $MEDIA_COUNT files), downloading..."
  if [ -f download-media.sh ]; then
    sh download-media.sh || echo "Media download completed or failed"
  fi
else
  echo "✅ Media files found: $MEDIA_COUNT files"
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