#!/bin/bash

# Production data import script for Dokploy
# Run this inside your container or from your local machine with proper connection

echo "🚀 Kawaii Bird Production Data Import"
echo "====================================="

# Connection details from your Dokploy
DB_HOST="webblog-kawaiibirddb-gq00ip"
DB_PORT="5432"
DB_NAME="kawaii-bird-db"
DB_USER="postgres"
DB_PASSWORD="2801"

# Export for psql
export PGPASSWORD=$DB_PASSWORD

echo "📊 Connecting to database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"

# Check connection
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" || {
    echo "❌ Cannot connect to database"
    echo "If running locally, you may need to:"
    echo "1. Use SSH tunnel: ssh -L 5432:$DB_HOST:5432 your-vps-ip"
    echo "2. Or run this script inside the Docker container"
    exit 1
}

# Check if posts table exists and count records
echo ""
echo "📋 Checking existing data..."
POST_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
POST_COUNT=$(echo $POST_COUNT | tr -d ' ')

if [ "$POST_COUNT" != "0" ]; then
    echo "⚠️  Found $POST_COUNT existing posts"
    read -p "Do you want to continue and potentially overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 1
    fi
fi

# Import the data
echo ""
echo "📥 Importing essential data..."

if [ -f "essential_data.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f essential_data.sql
    echo "✅ Import completed!"
elif [ -f "kawaiitorichan/essential_data.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f kawaiitorichan/essential_data.sql
    echo "✅ Import completed!"
else
    echo "❌ essential_data.sql not found!"
    echo "Make sure you're in the right directory or the file exists"
    exit 1
fi

# Verify import
echo ""
echo "📊 Verifying import..."
NEW_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
CATEGORY_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")
MEDIA_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM media;" 2>/dev/null || echo "0")

echo "✅ Import successful!"
echo "   - Posts: $NEW_COUNT"
echo "   - Categories: $CATEGORY_COUNT"
echo "   - Media: $MEDIA_COUNT"
echo ""
echo "🎉 Your Kawaii Bird site should now have content!"
echo "   Visit your site and refresh the page."