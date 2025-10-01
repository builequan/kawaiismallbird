#!/bin/bash

# Fix production category assignments
# This script should be run inside the Dokploy container or with access to production database

echo "🔧 Fixing category assignments in production database..."

# Run the SQL fix script
psql $DATABASE_URI -f /app/scripts/fix-categories.sql

echo "✅ Category assignments fixed!"
echo ""
echo "📊 Verifying distribution..."
psql $DATABASE_URI -c "
SELECT
  parent.title as parent_category,
  COUNT(pr.posts_id) as total_posts
FROM categories parent
JOIN categories child ON child.parent_id = parent.id
LEFT JOIN posts_rels pr ON pr.categories_id = child.id
GROUP BY parent.id, parent.title
ORDER BY total_posts DESC;
"

echo ""
echo "✅ Done! All 494 posts should now be distributed across categories."
