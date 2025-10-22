-- Fix media filename duplicates and update to match actual files on disk
-- Strategy:
-- 1. Find duplicate records that will map to the same file
-- 2. Keep the first record (lowest ID), delete the rest
-- 3. Update posts to reference the kept record
-- 4. Update filenames to match actual files on disk

-- Step 1: Create a mapping table of duplicates
CREATE TEMP TABLE media_mapping AS
WITH normalized AS (
  SELECT
    id,
    filename,
    regexp_replace(filename, '-hero-[0-9]+\.', '-hero.', 'g') as normalized_hero,
    regexp_replace(filename, '-section-[0-9]+\.', '-section-1.', 'g') as normalized_section
  FROM media
),
with_normalized AS (
  SELECT
    id,
    filename,
    CASE
      WHEN filename LIKE '%-hero-%' THEN normalized_hero
      WHEN filename LIKE '%-section-%' THEN normalized_section
      ELSE filename
    END as target_filename
  FROM normalized
),
first_ids AS (
  SELECT
    target_filename,
    MIN(id) as keep_id
  FROM with_normalized
  GROUP BY target_filename
)
SELECT
  wn.id as old_id,
  fi.keep_id as new_id,
  wn.filename as old_filename,
  wn.target_filename as new_filename
FROM with_normalized wn
JOIN first_ids fi ON wn.target_filename = fi.target_filename
WHERE wn.id != fi.keep_id;

-- Show what will be remapped
SELECT COUNT(*) as records_to_remap FROM media_mapping;

-- Step 2: Update posts.hero_image_id references
UPDATE posts
SET hero_image_id = m.new_id
FROM media_mapping m
WHERE posts.hero_image_id = m.old_id;

-- Step 3: Update posts.meta_image_id references
UPDATE posts
SET meta_image_id = m.new_id
FROM media_mapping m
WHERE posts.meta_image_id = m.old_id;

-- Step 4: Update posts_rels for any media relationships
-- (Usually posts don't directly relate to media via posts_rels, but just in case)

-- Step 5: Delete duplicate media records
DELETE FROM media
WHERE id IN (SELECT old_id FROM media_mapping);

-- Step 6: Now update the filenames on the kept records
UPDATE media
SET
  filename = regexp_replace(filename, '-hero-[0-9]+\.', '-hero.', 'g'),
  url = '/media/' || regexp_replace(filename, '-hero-[0-9]+\.', '-hero.', 'g'),
  -- Update ALL size variant filenames and URLs
  sizes_thumbnail_filename = regexp_replace(COALESCE(sizes_thumbnail_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_thumbnail_url = regexp_replace(COALESCE(sizes_thumbnail_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  thumbnail_u_r_l = regexp_replace(COALESCE(thumbnail_u_r_l, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_square_filename = regexp_replace(COALESCE(sizes_square_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_square_url = regexp_replace(COALESCE(sizes_square_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_small_filename = regexp_replace(COALESCE(sizes_small_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_small_url = regexp_replace(COALESCE(sizes_small_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_medium_filename = regexp_replace(COALESCE(sizes_medium_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_medium_url = regexp_replace(COALESCE(sizes_medium_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_large_filename = regexp_replace(COALESCE(sizes_large_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_large_url = regexp_replace(COALESCE(sizes_large_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_xlarge_filename = regexp_replace(COALESCE(sizes_xlarge_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_xlarge_url = regexp_replace(COALESCE(sizes_xlarge_url, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_og_filename = regexp_replace(COALESCE(sizes_og_filename, ''), '-hero-[0-9]+-', '-hero-', 'g'),
  sizes_og_url = regexp_replace(COALESCE(sizes_og_url, ''), '-hero-[0-9]+-', '-hero-', 'g')
WHERE filename LIKE '%-hero.jpg';

UPDATE media
SET
  filename = regexp_replace(filename, '-section-[0-9]+\.', '-section-1.', 'g'),
  url = '/media/' || regexp_replace(filename, '-section-[0-9]+\.', '-section-1.', 'g'),
  -- Update ALL size variant filenames and URLs
  sizes_thumbnail_filename = regexp_replace(COALESCE(sizes_thumbnail_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_thumbnail_url = regexp_replace(COALESCE(sizes_thumbnail_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  thumbnail_u_r_l = regexp_replace(COALESCE(thumbnail_u_r_l, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_square_filename = regexp_replace(COALESCE(sizes_square_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_square_url = regexp_replace(COALESCE(sizes_square_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_small_filename = regexp_replace(COALESCE(sizes_small_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_small_url = regexp_replace(COALESCE(sizes_small_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_medium_filename = regexp_replace(COALESCE(sizes_medium_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_medium_url = regexp_replace(COALESCE(sizes_medium_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_large_filename = regexp_replace(COALESCE(sizes_large_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_large_url = regexp_replace(COALESCE(sizes_large_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_xlarge_filename = regexp_replace(COALESCE(sizes_xlarge_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_xlarge_url = regexp_replace(COALESCE(sizes_xlarge_url, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_og_filename = regexp_replace(COALESCE(sizes_og_filename, ''), '-section-[0-9]+-', '-section-1-', 'g'),
  sizes_og_url = regexp_replace(COALESCE(sizes_og_url, ''), '-section-[0-9]+-', '-section-1-', 'g')
WHERE filename LIKE '%-section-1.jpg';

-- Step 7: Verify the fix
SELECT
  COUNT(*) as total_media,
  COUNT(*) FILTER (WHERE filename LIKE '%-hero.jpg') as hero_images,
  COUNT(*) FILTER (WHERE filename LIKE '%-section-1.jpg') as section_images
FROM media;

-- Show sample of fixed filenames
SELECT id, filename, url
FROM media
WHERE filename LIKE '%-hero.jpg' OR filename LIKE '%-section-1.jpg'
ORDER BY id
LIMIT 10;
