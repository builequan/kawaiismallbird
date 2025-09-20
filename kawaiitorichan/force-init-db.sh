#!/bin/sh
# Force initialize database - simpler approach

echo "==================================="
echo "🚀 QUICK IMPORT DATABASE INITIALIZATION"
echo "==================================="

# Parse DATABASE_URI if not already parsed
if [ -z "$DB_HOST" ] && [ -n "$DATABASE_URI" ]; then
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# List files to debug
echo "📁 Current directory contents:"
ls -la *.sql 2>&1 || echo "No SQL files visible"

# TRY QUICK IMPORT FIRST!
if [ -f quick-import.sql ]; then
  echo "✅ Found quick-import.sql - Creating posts with sample data..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f quick-import.sql 2>&1

  # Verify posts were created
  POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM posts" 2>/dev/null || echo "0")
  CAT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM categories" 2>/dev/null || echo "0")

  echo "✅ QUICK IMPORT COMPLETE: $POST_COUNT posts, $CAT_COUNT categories"
  echo "==================================="
  echo "DATABASE INITIALIZATION COMPLETE"
  echo "==================================="
  exit 0
fi

echo "⚠️ quick-import.sql not found, falling back to schema.sql..."

echo "Database details:"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Test connection first
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Cannot connect to database!"
  echo "Trying alternate connection..."
  # Try with explicit port
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "ERROR: Still cannot connect to database!"
    exit 1
  fi
fi

echo "Database connection successful!"

# Drop all existing tables and recreate (NUCLEAR OPTION)
echo "Dropping existing tables if any..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

echo "Applying schema.sql..."
if [ -f schema.sql ]; then
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME < schema.sql
  echo "Schema applied!"
else
  echo "ERROR: schema.sql not found!"
  exit 1
fi

# Verify tables were created
echo "Verifying tables..."
TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
echo "Created $TABLES tables"

echo "==================================="
echo "DATABASE INITIALIZATION COMPLETE"
echo "==================================="