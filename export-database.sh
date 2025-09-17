#!/bin/bash

echo "Creating database backup..."

# Use PostgreSQL 17's pg_dump
PGPASSWORD=2801 /Library/PostgreSQL/17/bin/pg_dump \
  -h localhost \
  -U postgres \
  -d golfer \
  --no-owner \
  --no-privileges \
  -f golfer_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    echo "File: golfer_backup.sql"
    echo "Size: $(ls -lh golfer_backup.sql | awk '{print $5}')"
else
    echo "❌ Backup failed"
fi