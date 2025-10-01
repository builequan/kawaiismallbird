-- Fix category assignments by distributing posts evenly across subcategories
-- This version uses slugs instead of hardcoded IDs for compatibility

-- First, clear existing category relationships
DELETE FROM posts_rels WHERE categories_id IS NOT NULL;

-- Create temporary table to store post distribution
CREATE TEMP TABLE post_distribution AS
WITH
  posts_ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 as row_num
    FROM posts
    WHERE _status = 'published'
  ),
  parent_categories AS (
    -- Get all parent categories
    SELECT id, slug, title FROM categories WHERE parent_id IS NULL
  ),
  category_groups AS (
    -- Get all subcategories grouped by parent slug
    SELECT
      c.id,
      c.title,
      CASE
        WHEN p.slug LIKE '%species%' OR p.title LIKE '%種類%' THEN 0
        WHEN p.slug LIKE '%care%' OR p.title LIKE '%飼い方%' THEN 1
        WHEN p.slug LIKE '%health%' OR p.title LIKE '%健康%' THEN 2
        WHEN p.slug LIKE '%behavior%' OR p.title LIKE '%生態%' THEN 3
        WHEN p.slug LIKE '%watching%' OR p.title LIKE '%野鳥観察%' THEN 4
        WHEN p.slug LIKE '%nutrition%' OR p.slug LIKE '%feeding%' OR p.title LIKE '%餌%' OR p.title LIKE '%栄養%' THEN 5
        ELSE 6
      END as group_idx,
      ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY c.id) - 1 as cat_idx
    FROM categories c
    JOIN categories p ON c.parent_id = p.id
    WHERE c.parent_id IS NOT NULL
  ),
  group_sizes AS (
    SELECT group_idx, COUNT(*) as size
    FROM category_groups
    GROUP BY group_idx
  )
SELECT
  p.id as post_id,
  cg.id as category_id,
  cg.title as category_title
FROM posts_ordered p
CROSS JOIN LATERAL (
  SELECT *
  FROM category_groups cg
  JOIN group_sizes gs ON cg.group_idx = gs.group_idx
  WHERE cg.group_idx = p.row_num % 6
    AND cg.cat_idx = (p.row_num / 6) % gs.size
  LIMIT 1
) cg;

-- Insert the relationships
INSERT INTO posts_rels (posts_id, categories_id, "order", parent_id, path)
SELECT
  post_id,
  category_id,
  0 as "order",
  post_id as parent_id,
  'categories' as path
FROM post_distribution;

-- Show distribution summary
SELECT
  c.id,
  c.title,
  c.parent_id,
  COUNT(pr.posts_id) as post_count
FROM categories c
LEFT JOIN posts_rels pr ON c.id = pr.categories_id
GROUP BY c.id, c.title, c.parent_id
HAVING COUNT(pr.posts_id) > 0
ORDER BY post_count DESC, c.id;

-- Summary by parent category
SELECT
  parent.title as parent_category,
  COUNT(pr.posts_id) as total_posts
FROM categories parent
JOIN categories child ON child.parent_id = parent.id
LEFT JOIN posts_rels pr ON pr.categories_id = child.id
GROUP BY parent.id, parent.title
ORDER BY total_posts DESC;
