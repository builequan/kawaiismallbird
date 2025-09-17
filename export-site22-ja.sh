#!/bin/bash

echo "Exporting Japanese posts from site 22..."

# Export with WHERE clause for specific site and language
PGPASSWORD=2801 /Library/PostgreSQL/17/bin/pg_dump \
  -h localhost \
  -U postgres \
  -d golfer \
  --no-owner \
  --no-acl \
  --data-only \
  --table=posts \
  --table=media \
  --table=categories \
  --table=users \
  -f site22_ja_data.sql

# Check the categories and posts to filter
echo "
-- Filter for Japanese content from site 22
SELECT COUNT(*) as post_count FROM posts WHERE wordpress_site_id = '22' OR language = 'ja';
" | PGPASSWORD=2801 /Library/PostgreSQL/17/bin/psql -h localhost -U postgres -d golfer

echo "Export complete: site22_ja_data.sql"
ls -lh site22_ja_data.sql