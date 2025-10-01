-- Fix category assignments by distributing posts evenly across subcategories

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
  category_groups AS (
    -- Bird types (9 categories, parent 359)
    SELECT id, title, 0 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 359
    UNION ALL
    -- Care categories (6 categories, parent 368)
    SELECT id, title, 1 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 368
    UNION ALL
    -- Health categories (6 categories, parent 369)
    SELECT id, title, 2 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 369
    UNION ALL
    -- Behavior categories (6 categories, parent 392)
    SELECT id, title, 3 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 392
    UNION ALL
    -- Observation categories (6 categories, parent 399)
    SELECT id, title, 4 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 399
    UNION ALL
    -- Nutrition categories (8 categories, parent 405)
    SELECT id, title, 5 as group_idx, ROW_NUMBER() OVER (ORDER BY id) - 1 as cat_idx
    FROM categories WHERE parent_id = 405
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
