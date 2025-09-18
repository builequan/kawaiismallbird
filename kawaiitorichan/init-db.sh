#!/bin/sh
# Initialize database with schema if tables don't exist

echo "Checking if database needs initialization..."

# Check if the 'users' table exists
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='users'" 2>/dev/null || echo "0")

if [ "$TABLE_EXISTS" = "1" ]; then
  echo "Database already initialized, tables exist."
else
  echo "Database tables not found. Initializing..."

  # Apply the schema
  if [ -f schema.sql ]; then
    echo "Applying schema.sql..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME < schema.sql

    if [ $? -eq 0 ]; then
      echo "Database initialized successfully!"
    else
      echo "Failed to initialize database, but continuing anyway..."
    fi
  else
    echo "schema.sql not found, skipping database initialization."
  fi
fi