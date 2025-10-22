-- Fix category assignments for bird posts
-- Auto-categorize based on keywords in post titles

-- First, clear existing category relationships
DELETE FROM posts_rels WHERE categories_id IS NOT NULL AND path = 'categories';

-- Get category IDs
DO $$
DECLARE
  cat_food_nutrition INTEGER;
  cat_wild_birds INTEGER;
  cat_bird_ecology INTEGER;
  cat_bird_health INTEGER;
  cat_bird_care INTEGER;
  cat_bird_species INTEGER;
BEGIN
  -- Get category IDs
  SELECT id INTO cat_food_nutrition FROM categories WHERE slug = 'food-nutrition' LIMIT 1;
  SELECT id INTO cat_wild_birds FROM categories WHERE slug = 'wild-birds' LIMIT 1;
  SELECT id INTO cat_bird_ecology FROM categories WHERE slug = 'bird-ecology' LIMIT 1;
  SELECT id INTO cat_bird_health FROM categories WHERE slug = 'bird-health' LIMIT 1;
  SELECT id INTO cat_bird_care FROM categories WHERE slug = 'bird-care' LIMIT 1;
  SELECT id INTO cat_bird_species FROM categories WHERE slug = 'bird-species' LIMIT 1;

  -- Only proceed if categories exist
  IF cat_food_nutrition IS NOT NULL AND cat_bird_care IS NOT NULL THEN
    -- Assign bird-health category to health-related posts
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_bird_health, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_bird_health IS NOT NULL
      AND (
        title ~* '健康|獣医|病気|診察|免疫|寿命|不安|ストレス|くちばし|食欲'
      );

    -- Assign bird-care category to care-related posts
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_bird_care, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_bird_care IS NOT NULL
      AND (
        title ~* '鳥かご|ケージ|飼い|お世話|引っ越|絆|錆|修理|臭い|ドア|ロック|清潔|空気|サビ|鳥舎'
      )
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );

    -- Assign food-nutrition category
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_food_nutrition, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_food_nutrition IS NOT NULL
      AND title ~* '餌|栄養|食事|フード'
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );

    -- Assign bird-species category
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_bird_species, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_bird_species IS NOT NULL
      AND title ~* 'インコ|オカメインコ|コカトゥー|文鳥|カナリア|セキセイインコ|種類|品種'
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );

    -- Assign wild-birds category
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_wild_birds, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_wild_birds IS NOT NULL
      AND title ~* '野鳥|観察|バードウォッチング'
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );

    -- Assign bird-ecology category
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_bird_ecology, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_bird_ecology IS NOT NULL
      AND title ~* '生態|習性|行動|鳴き声|羽|飛行'
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );

    -- Assign default category (bird-care) to remaining posts
    INSERT INTO posts_rels (parent_id, path, categories_id, "order")
    SELECT id, 'categories', cat_bird_care, 1
    FROM posts
    WHERE _status = 'published'
      AND cat_bird_care IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM posts_rels pr
        WHERE pr.parent_id = posts.id AND pr.path = 'categories'
      );
  END IF;
END $$;

-- Show distribution summary
SELECT
  c.title as category,
  c.slug,
  COUNT(pr.id) as post_count
FROM categories c
LEFT JOIN posts_rels pr ON c.id = pr.categories_id AND pr.path = 'categories'
GROUP BY c.id, c.title, c.slug
ORDER BY c."order";
