#!/bin/sh
# Initialize database with schema if tables don't exist

echo "Checking if database needs initialization..."

# Check if ALL required tables exist (not just users)
PAGES_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='pages'" 2>/dev/null || echo "0")
FOOTER_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='footer'" 2>/dev/null || echo "0")
POSTS_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='posts'" 2>/dev/null || echo "0")

if [ "$PAGES_EXISTS" = "1" ] && [ "$FOOTER_EXISTS" = "1" ] && [ "$POSTS_EXISTS" = "1" ]; then
  echo "Database already initialized, all tables exist."
else
  echo "Some database tables are missing. Initializing..."
  echo "Pages table exists: $PAGES_EXISTS"
  echo "Footer table exists: $FOOTER_EXISTS"
  echo "Posts table exists: $POSTS_EXISTS"

  # Force apply the schema (will create missing tables)
  if [ -f schema.sql ]; then
    echo "Applying schema.sql..."
    # Use -f to force and continue on errors (in case some tables exist)
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f schema.sql 2>&1 | head -20

    if [ $? -eq 0 ]; then
      echo "Database initialized successfully!"
    else
      echo "Some errors during initialization, but continuing..."
    fi
  else
    echo "schema.sql not found, skipping database initialization."
  fi
fi