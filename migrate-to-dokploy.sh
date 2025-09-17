#!/bin/bash

echo "==================================="
echo "Database Migration to Dokploy"
echo "==================================="

# Set variables
LOCAL_DB="golfer"
LOCAL_USER="postgres"
LOCAL_PASSWORD="2801"
LOCAL_HOST="localhost"

DOKPLOY_DB="kawaii-bird-db"
DOKPLOY_USER="postgres"
DOKPLOY_PASSWORD="2801"
DOKPLOY_HOST="100.94.235.84"
DOKPLOY_PORT="5432"  # You'll need to update this with the exposed port

# Create backup from local database
echo "Step 1: Creating backup from local PostgreSQL..."
PGPASSWORD=$LOCAL_PASSWORD pg_dump -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -v -f golfer_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: golfer_backup.sql"
    echo "Size: $(ls -lh golfer_backup.sql | awk '{print $5}')"
else
    echo "❌ Failed to create backup"
    exit 1
fi

echo ""
echo "==================================="
echo "Step 2: Upload backup to Dokploy"
echo "==================================="
echo ""
echo "You need to:"
echo "1. Find the exposed PostgreSQL port in Dokploy (it's not 5432, it's mapped to another port)"
echo "2. Run this command with the correct port:"
echo ""
echo "PGPASSWORD=$DOKPLOY_PASSWORD psql -h $DOKPLOY_HOST -p [EXPOSED_PORT] -U $DOKPLOY_USER -d $DOKPLOY_DB < golfer_backup.sql"
echo ""
echo "Or if you have SSH access to Dokploy server:"
echo "1. Copy the backup file: scp golfer_backup.sql user@$DOKPLOY_HOST:~/"
echo "2. SSH into server and restore: psql -U $DOKPLOY_USER -d $DOKPLOY_DB < golfer_backup.sql"
echo ""
echo "Backup file is ready at: $(pwd)/golfer_backup.sql"