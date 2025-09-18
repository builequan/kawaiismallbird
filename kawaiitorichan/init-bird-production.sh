#!/bin/sh
# Production initialization script for bird theme (uses SQL directly)

echo "🦜 Initializing Kawaii Bird Production Content..."

# Parse database URL
if [ -n "$DATABASE_URI" ]; then
  export PGUSER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export PGPASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export PGHOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export PGPORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export PGDATABASE=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "📊 Applying bird content to database..."
  echo "   Host: $PGHOST"
  echo "   Database: $PGDATABASE"

  # Run SQL script
  if [ -f init-bird-content.sql ]; then
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f init-bird-content.sql

    if [ $? -eq 0 ]; then
      echo "✅ Bird content initialized successfully!"
    else
      echo "⚠️ Failed to initialize bird content (may already exist)"
    fi
  else
    echo "❌ SQL script not found: init-bird-content.sql"
  fi
else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

echo "🌐 Kawaii Bird production initialization complete!"