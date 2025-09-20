#!/bin/sh
set -e

echo "📥 Checking for production data to import..."

# Check if production_data.json exists
if [ ! -f production_data.json ]; then
  echo "⚠️ No production_data.json found. Skipping import."
  exit 0
fi

echo "📊 Found production_data.json, preparing import..."

# Create a temporary SQL file from the JSON data
cat > /tmp/import_data.sql << 'EOF'
-- Import production data from JSON

-- First, ensure tables exist
DO $$
BEGIN
  -- Check if categories table exists and has data
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
    RAISE NOTICE 'Categories table does not exist yet';
  END IF;
END $$;

-- Import categories (handle case where unique constraint might not exist)
DO $$
BEGIN
  -- Try to insert categories, ignore if they already exist
  INSERT INTO categories (title, slug, "createdAt", "updatedAt")
  SELECT * FROM (VALUES
    ('セキセイインコ', 'budgerigar', NOW(), NOW()),
    ('オカメインコ', 'cockatiel', NOW(), NOW()),
    ('文鳥', 'java-sparrow', NOW(), NOW()),
    ('コザクラインコ', 'lovebird', NOW(), NOW()),
    ('ボタンインコ', 'button-parakeet', NOW(), NOW()),
    ('マメルリハ', 'pacific-parrotlet', NOW(), NOW()),
    ('コガネメキシコインコ', 'sun-conure', NOW(), NOW()),
    ('ウロコインコ', 'green-cheeked-conure', NOW(), NOW()),
    ('オキナインコ', 'monk-parakeet', NOW(), NOW()),
    ('ヨウム', 'african-grey-parrot', NOW(), NOW()),
    ('飼い方・お世話', 'care-guides', NOW(), NOW()),
    ('健康・病気', 'health', NOW(), NOW())
  ) AS t(title, slug, "createdAt", "updatedAt")
  WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.slug = t.slug
  );

  RAISE NOTICE '✅ Categories imported or already exist';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Category import warning: %', SQLERRM;
END $$;

-- Import sample posts if posts table is empty
DO $$
DECLARE
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count FROM posts;

  IF post_count = 0 THEN
    -- Import some essential posts (avoid conflict errors)
    INSERT INTO posts (title, slug, content, status, "publishedAt", "createdAt", "updatedAt")
    SELECT * FROM (VALUES
      ('セキセイインコの飼い方完全ガイド', 'budgerigar-care-guide',
       '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"セキセイインコは小型で人懐っこい鳥として、世界中で愛されています。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb,
       'published', NOW(), NOW(), NOW()),

      ('オカメインコの特徴と魅力', 'cockatiel-features',
       '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"オカメインコは冠羽が特徴的な中型インコです。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb,
       'published', NOW(), NOW(), NOW()),

      ('文鳥の鳴き声と習性', 'java-sparrow-behavior',
       '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"文鳥は美しい鳴き声と愛らしい仕草で人気の小鳥です。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb,
       'published', NOW(), NOW(), NOW()),

      ('コザクラインコの飼育環境', 'lovebird-environment',
       '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"コザクラインコは活発で遊び好きな小型インコです。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb,
       'published', NOW(), NOW(), NOW()),

      ('小鳥の健康管理と病気の予防', 'bird-health-management',
       '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"小鳥の健康を維持するために重要なポイントをご紹介します。","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}'::jsonb,
       'published', NOW(), NOW(), NOW())
    ) AS t(title, slug, content, status, "publishedAt", "createdAt", "updatedAt")
    WHERE NOT EXISTS (
      SELECT 1 FROM posts p WHERE p.slug = t.slug
    );

    -- Link posts to categories
    INSERT INTO posts_rels (parent_id, path, category_id)
    SELECT p.id, 'categories', c.id
    FROM posts p, categories c
    WHERE
      (p.slug = 'budgerigar-care-guide' AND c.slug = 'budgerigar') OR
      (p.slug = 'cockatiel-features' AND c.slug = 'cockatiel') OR
      (p.slug = 'java-sparrow-behavior' AND c.slug = 'java-sparrow') OR
      (p.slug = 'lovebird-environment' AND c.slug = 'lovebird') OR
      (p.slug = 'bird-health-management' AND c.slug = 'health')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Imported sample posts successfully';
  ELSE
    RAISE NOTICE '⏭️ Posts already exist, skipping import';
  END IF;
END $$;

-- Update sequences
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1), true);
SELECT setval('posts_id_seq', COALESCE((SELECT MAX(id) FROM posts), 1), true);

EOF

echo "🔄 Importing data into database..."

# Run the import
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/import_data.sql 2>&1

# Verify the import
POST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM posts;" 2>/dev/null || echo "0")
CATEGORY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM categories;" 2>/dev/null || echo "0")

echo "✅ Import completed!"
echo "   - Posts: $POST_COUNT"
echo "   - Categories: $CATEGORY_COUNT"

# Clean up
rm -f /tmp/import_data.sql