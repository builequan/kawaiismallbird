#!/bin/bash

echo "==================================="
echo "Exporting Complete Japanese Site Data"
echo "==================================="

# Export all tables needed for the Japanese site
PGPASSWORD=2801 /Library/PostgreSQL/17/bin/pg_dump \
  -h localhost \
  -U postgres \
  -d golfer \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f complete_site22_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Complete backup created successfully!"
    echo "File: complete_site22_backup.sql"
    echo "Size: $(ls -lh complete_site22_backup.sql | awk '{print $5}')"

    # Create a smaller version with just essential tables
    echo ""
    echo "Creating optimized version with posts, media, categories, and users..."

    PGPASSWORD=2801 /Library/PostgreSQL/17/bin/pg_dump \
      -h localhost \
      -U postgres \
      -d golfer \
      --no-owner \
      --no-acl \
      --clean \
      --if-exists \
      --table=posts \
      --table=media \
      --table=categories \
      --table=users \
      --table=posts_rels \
      --table=payload_preferences \
      --table=payload_preferences_rels \
      --table=payload_migrations \
      -f site22_with_media.sql

    echo "✅ Optimized backup created!"
    echo "File: site22_with_media.sql"
    echo "Size: $(ls -lh site22_with_media.sql | awk '{print $5}')"
else
    echo "❌ Backup failed"
fi