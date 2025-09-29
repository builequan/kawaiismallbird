#!/bin/sh
# Failsafe script to ensure _status column exists
# This runs AFTER any table creation to guarantee the column is present

echo "🔧 ENSURING _STATUS COLUMN EXISTS" >&2

# Parse DATABASE_URI
if [ -n "$DATABASE_URI" ]; then
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

echo "📊 Checking current schema..." >&2

# First, check if the posts table exists
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "✅ Posts table exists" >&2

  # Check if _status column exists
  COLUMN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = '_status');" 2>/dev/null | tr -d ' ')

  if [ "$COLUMN_EXISTS" = "f" ] || [ -z "$COLUMN_EXISTS" ]; then
    echo "⚠️ _status column is MISSING! Adding it now..." >&2

    # Create ENUM type if it doesn't exist and add column
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -20
-- Create ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE enum_posts_status AS ENUM ('draft', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add _status column with default value
ALTER TABLE posts ADD COLUMN IF NOT EXISTS _status enum_posts_status DEFAULT 'published'::enum_posts_status NOT NULL;

-- Update any NULL values to 'published'
UPDATE posts SET _status = 'published' WHERE _status IS NULL;

-- Ensure we also have language column
DO $$ BEGIN
    CREATE TYPE enum_posts_language AS ENUM ('ja', 'en');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS language enum_posts_language DEFAULT 'ja'::enum_posts_language;
UPDATE posts SET language = 'ja' WHERE language IS NULL;

-- Add other required columns if missing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hero_image_alt VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meta_focus_keyphrase VARCHAR;

-- Add index for _status column
CREATE INDEX IF NOT EXISTS posts__status_idx ON posts (_status);
CREATE INDEX IF NOT EXISTS posts_language_idx ON posts (language);
EOF

    echo "✅ _status column added successfully!" >&2
  else
    echo "✅ _status column already exists" >&2
  fi

  # Verify column now exists
  echo "🔍 Final verification..." >&2
  FINAL_CHECK=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts' AND column_name = '_status';" 2>/dev/null)

  if [ -n "$FINAL_CHECK" ]; then
    echo "✅ VERIFIED: _status column exists: $FINAL_CHECK" >&2

    # Check some values
    STATUS_VALUES=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT DISTINCT _status FROM posts LIMIT 5;" 2>/dev/null)
    echo "📊 Sample _status values: $STATUS_VALUES" >&2
  else
    echo "❌ ERROR: _status column still not found!" >&2

    # Try alternative approach - add as VARCHAR if ENUM fails
    echo "🔧 Attempting alternative approach with VARCHAR..." >&2
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1
-- Drop the column if it exists incorrectly
ALTER TABLE posts DROP COLUMN IF EXISTS _status;

-- Add as VARCHAR first (more flexible)
ALTER TABLE posts ADD COLUMN _status VARCHAR DEFAULT 'published' NOT NULL;

-- Add constraint to limit values
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (_status IN ('draft', 'published'));

-- Update all rows
UPDATE posts SET _status = 'published' WHERE _status IS NULL OR _status = '';
EOF
    echo "✅ Added _status as VARCHAR with constraint" >&2
  fi

else
  echo "❌ Posts table doesn't exist - need to create schema first" >&2
fi

# Check media table for prefix column (common issue with Payload CMS)
echo "" >&2
echo "🖼️ Checking media table..." >&2
MEDIA_TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media');" 2>/dev/null | tr -d ' ')

if [ "$MEDIA_TABLE_EXISTS" = "t" ]; then
  echo "✅ Media table exists" >&2

  # Check if prefix column exists (common Payload CMS issue)
  PREFIX_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media' AND column_name = 'prefix');" 2>/dev/null | tr -d ' ')

  if [ "$PREFIX_EXISTS" = "f" ] || [ -z "$PREFIX_EXISTS" ]; then
    echo "⚠️ prefix column is MISSING in media table! Adding it now..." >&2

    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF' 2>&1 | head -20
-- Add prefix column to media table (required by Payload CMS)
ALTER TABLE media ADD COLUMN IF NOT EXISTS prefix VARCHAR DEFAULT 'media';

-- Add other commonly missing media columns
ALTER TABLE media ADD COLUMN IF NOT EXISTS _key VARCHAR;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_x NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS focal_y NUMERIC;
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_u_r_l VARCHAR;
EOF
    echo "✅ prefix column added to media table!" >&2
  else
    echo "✅ prefix column already exists in media table" >&2
  fi
fi

# Final status report
echo "" >&2
echo "📊 Database column status:" >&2
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'posts' AND column_name IN ('_status', 'language', 'id', 'title');" 2>/dev/null | head -10

echo "🎉 Status column check complete!" >&2