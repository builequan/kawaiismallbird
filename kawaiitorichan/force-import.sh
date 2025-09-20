#!/bin/sh
# Force import script - runs inside the container

echo "🚀 FORCING DATA IMPORT TO KAWAII BIRD DATABASE"
echo "=============================================="

# Parse DATABASE_URI to get connection details
if [ -n "$DATABASE_URI" ]; then
  export DB_USER=$(echo $DATABASE_URI | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  export DB_PASSWORD=$(echo $DATABASE_URI | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  export DB_HOST=$(echo $DATABASE_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  export DB_PORT=$(echo $DATABASE_URI | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  export DB_NAME=$(echo $DATABASE_URI | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "Database connection:"
  echo "  Host: $DB_HOST"
  echo "  Port: $DB_PORT"
  echo "  Database: $DB_NAME"
  echo "  User: $DB_USER"
else
  echo "❌ DATABASE_URI not set!"
  exit 1
fi

# Check if essential_data.sql exists
if [ ! -f essential_data.sql ]; then
  echo "❌ essential_data.sql not found!"
  echo "Files in current directory:"
  ls -la *.sql
  exit 1
fi

echo ""
echo "📥 IMPORTING DATA NOW..."
echo "This will add all posts, categories, and media to your database"
echo ""

# Force import without checking if data exists
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f essential_data.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ IMPORT SUCCESSFUL!"
  echo ""

  # Count what was imported
  POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
  CAT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")
  MEDIA_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")

  echo "📊 Database now contains:"
  echo "   Posts: $POST_COUNT"
  echo "   Categories: $CAT_COUNT"
  echo "   Media: $MEDIA_COUNT"
  echo ""
  echo "🎉 YOUR WEBSITE NOW HAS CONTENT!"
  echo "   Please refresh your browser to see the posts."
else
  echo ""
  echo "❌ Import failed. Please check the error messages above."
  echo "   You may need to clear the database first or check the connection."
fi