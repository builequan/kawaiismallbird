-- Fix media filenames to match actual files on disk
-- Database has versioned filenames (-2, -3, -4) but actual files have base versions
-- Hero images: -hero-2.jpg -> -hero.jpg
-- Section images: -section-3.jpg -> -section-1.jpg

-- Backup current state (optional, for reference)
-- CREATE TABLE media_backup AS SELECT * FROM media;

-- Fix hero image filenames: remove version numbers (-2, -3, -4, etc.)
UPDATE media
SET
  filename = regexp_replace(filename, '-hero-[0-9]+\.', '-hero.', 'g'),
  url = regexp_replace(url, '-hero-[0-9]+\.', '-hero.', 'g'),
  thumbnail_u_r_l = regexp_replace(COALESCE(thumbnail_u_r_l, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_thumbnail_url = regexp_replace(COALESCE(sizes_thumbnail_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_thumbnail_filename = regexp_replace(COALESCE(sizes_thumbnail_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_square_url = regexp_replace(COALESCE(sizes_square_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_square_filename = regexp_replace(COALESCE(sizes_square_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_small_url = regexp_replace(COALESCE(sizes_small_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_small_filename = regexp_replace(COALESCE(sizes_small_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_medium_url = regexp_replace(COALESCE(sizes_medium_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_medium_filename = regexp_replace(COALESCE(sizes_medium_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_large_url = regexp_replace(COALESCE(sizes_large_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_large_filename = regexp_replace(COALESCE(sizes_large_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_xlarge_url = regexp_replace(COALESCE(sizes_xlarge_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_xlarge_filename = regexp_replace(COALESCE(sizes_xlarge_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_og_url = regexp_replace(COALESCE(sizes_og_url, ''), '-hero-[0-9]+\.', '-hero.', 'g'),
  sizes_og_filename = regexp_replace(COALESCE(sizes_og_filename, ''), '-hero-[0-9]+\.', '-hero.', 'g')
WHERE filename LIKE '%-hero-%.jpg';

-- Fix section image filenames: change version numbers to -1
UPDATE media
SET
  filename = regexp_replace(filename, '-section-[0-9]+\.', '-section-1.', 'g'),
  url = regexp_replace(url, '-section-[0-9]+\.', '-section-1.', 'g'),
  thumbnail_u_r_l = regexp_replace(COALESCE(thumbnail_u_r_l, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_thumbnail_url = regexp_replace(COALESCE(sizes_thumbnail_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_thumbnail_filename = regexp_replace(COALESCE(sizes_thumbnail_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_square_url = regexp_replace(COALESCE(sizes_square_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_square_filename = regexp_replace(COALESCE(sizes_square_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_small_url = regexp_replace(COALESCE(sizes_small_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_small_filename = regexp_replace(COALESCE(sizes_small_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_medium_url = regexp_replace(COALESCE(sizes_medium_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_medium_filename = regexp_replace(COALESCE(sizes_medium_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_large_url = regexp_replace(COALESCE(sizes_large_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_large_filename = regexp_replace(COALESCE(sizes_large_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_xlarge_url = regexp_replace(COALESCE(sizes_xlarge_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_xlarge_filename = regexp_replace(COALESCE(sizes_xlarge_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_og_url = regexp_replace(COALESCE(sizes_og_url, ''), '-section-[0-9]+\.', '-section-1.', 'g'),
  sizes_og_filename = regexp_replace(COALESCE(sizes_og_filename, ''), '-section-[0-9]+\.', '-section-1.', 'g')
WHERE filename LIKE '%-section-%.jpg';

-- Verify the fix
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
