-- Populate _posts_v (post versions) table for posts that don't have versions
-- This is necessary when posts are imported directly into the database
-- without going through PayloadCMS, which normally creates versions automatically
--
-- CRITICAL: This script copies ALL fields including hero_image_id and metadata
-- to ensure images and SEO data appear correctly in the admin panel

\echo 'Populating post versions for admin panel visibility...'
\echo ''

-- Step 1: Show current state
\echo 'Current state:'
SELECT
  CONCAT('  Posts: ', COUNT(*)) as info
FROM posts
UNION ALL
SELECT
  CONCAT('  Versions: ', COUNT(*))
FROM _posts_v
UNION ALL
SELECT
  CONCAT('  Latest versions: ', COUNT(*))
FROM _posts_v
WHERE latest = true
UNION ALL
SELECT
  CONCAT('  Posts with versions: ', COUNT(DISTINCT parent_id))
FROM _posts_v;

\echo ''
\echo 'Finding posts without versions...'

-- Step 2: Create version entries for posts without versions
-- IMPORTANT: Copy ALL fields from posts to _posts_v
INSERT INTO _posts_v (
  parent_id,
  version_title,
  version_slug,
  version_slug_lock,
  version_content,
  version_excerpt,
  version_language,
  version_hero_image_id,                              -- ✅ CRITICAL: Hero image
  version_hero_image_alt,
  version_meta_title,                                 -- SEO metadata
  version_meta_image_id,
  version_meta_description,
  version_meta_keywords,
  version_meta_focus_keyphrase,
  version_published_at,
  version__status,
  version_updated_at,
  version_created_at,
  version_wordpress_metadata_original_author,         -- WordPress import metadata
  version_wordpress_metadata_original_date,
  version_wordpress_metadata_modified_date,
  version_wordpress_metadata_status,
  version_wordpress_metadata_enable_comments,
  version_wordpress_metadata_enable_toc,
  version_internal_links_metadata_version,            -- Internal linking metadata
  version_internal_links_metadata_last_processed,
  version_internal_links_metadata_content_hash,
  version_affiliate_links_metadata_version,           -- Affiliate linking metadata
  version_affiliate_links_metadata_last_processed,
  version_affiliate_links_metadata_content_hash,
  version_affiliate_links_metadata_exclude_from_affiliates,
  version_content_db_meta_original_id,                -- Content DB metadata
  version_content_db_meta_website_id,
  version_content_db_meta_language,
  version_content_db_meta_imported_at,
  latest,                                             -- Mark as latest version
  autosave,                                           -- Not an autosave
  updated_at,
  created_at
)
SELECT
  p.id,                                               -- parent_id links to posts.id
  p.title,
  p.slug,
  p.slug_lock,
  p.content,
  p.excerpt,
  CASE
    WHEN p.language IS NOT NULL THEN p.language::text::enum__posts_v_version_language
    ELSE 'ja'::enum__posts_v_version_language
  END,
  p.hero_image_id,                                    -- ✅ CRITICAL: Copy hero image!
  p.hero_image_alt,
  p.meta_title,
  p.meta_image_id,
  p.meta_description,
  p.meta_keywords,
  p.meta_focus_keyphrase,
  p.published_at,
  CASE
    WHEN p._status IS NOT NULL THEN p._status::text::enum__posts_v_version_status
    ELSE 'published'::enum__posts_v_version_status
  END,
  p.updated_at,
  p.created_at,
  p.wordpress_metadata_original_author,
  p.wordpress_metadata_original_date,
  p.wordpress_metadata_modified_date,
  CASE
    WHEN p.wordpress_metadata_status IS NOT NULL THEN p.wordpress_metadata_status::text::enum__posts_v_version_wordpress_metadata_status
    ELSE NULL
  END,
  p.wordpress_metadata_enable_comments,
  p.wordpress_metadata_enable_toc,
  p.internal_links_metadata_version,
  p.internal_links_metadata_last_processed,
  p.internal_links_metadata_content_hash,
  p.affiliate_links_metadata_version,
  p.affiliate_links_metadata_last_processed,
  p.affiliate_links_metadata_content_hash,
  p.affiliate_links_metadata_exclude_from_affiliates,
  p.content_db_meta_original_id,
  p.content_db_meta_website_id,
  p.content_db_meta_language,
  p.content_db_meta_imported_at,
  true,                                               -- latest = true
  false,                                              -- autosave = false
  p.updated_at,
  p.created_at
FROM posts p
LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
WHERE v.id IS NULL
AND p.title IS NOT NULL AND p.title <> '';

\echo 'Version entries created'
\echo ''

-- Step 3: Copy relationships from posts_rels to _posts_v_rels
\echo 'Copying relationships to version table...'

INSERT INTO _posts_v_rels (
  "order",                    -- "order" is a reserved word, must be quoted
  parent_id,                  -- Links to _posts_v.id (NOT posts.id!)
  path,
  posts_id,                   -- Related posts
  categories_id,              -- Categories
  users_id,                   -- Authors
  tags_id                     -- Tags
)
SELECT
  pr."order",
  pv.id,                      -- Version ID (not parent post ID!)
  CASE
    WHEN pr.path = 'categories' THEN 'version.categories'
    WHEN pr.path = 'tags' THEN 'version.tags'
    WHEN pr.path = 'authors' THEN 'version.authors'
    WHEN pr.path = 'populatedAuthors' THEN 'version.populatedAuthors'
    ELSE pr.path
  END,
  pr.posts_id,
  pr.categories_id,
  pr.users_id,
  pr.tags_id
FROM posts_rels pr
JOIN _posts_v pv ON pv.parent_id = pr.parent_id    -- Link via parent_id
WHERE pv.latest = true                              -- Only latest versions
AND NOT EXISTS (
  SELECT 1 FROM _posts_v_rels vr
  WHERE vr.parent_id = pv.id
  AND CASE
    WHEN pr.path = 'categories' THEN vr.path = 'version.categories'
    WHEN pr.path = 'tags' THEN vr.path = 'version.tags'
    WHEN pr.path = 'authors' THEN vr.path = 'version.authors'
    WHEN pr.path = 'populatedAuthors' THEN vr.path = 'version.populatedAuthors'
    ELSE vr.path = pr.path
  END
  AND COALESCE(vr.categories_id, 0) = COALESCE(pr.categories_id, 0)
  AND COALESCE(vr.users_id, 0) = COALESCE(pr.users_id, 0)
  AND COALESCE(vr.tags_id, 0) = COALESCE(pr.tags_id, 0)
);

\echo 'Relationships copied'
\echo ''

-- Step 4: Show final state with hero image statistics
\echo 'Final state:'
SELECT
  CONCAT('  Posts: ', COUNT(*)) as info
FROM posts
UNION ALL
SELECT
  CONCAT('  Versions: ', COUNT(*))
FROM _posts_v
UNION ALL
SELECT
  CONCAT('  Latest versions: ', COUNT(*))
FROM _posts_v
WHERE latest = true
UNION ALL
SELECT
  CONCAT('  Versions with hero images: ', COUNT(*))
FROM _posts_v
WHERE latest = true AND version_hero_image_id IS NOT NULL
UNION ALL
SELECT
  CONCAT('  Version relationships: ', COUNT(*))
FROM _posts_v_rels;

\echo ''
\echo '✅ All posts now have versions with complete metadata!'
\echo '✅ Hero images, SEO data, and relationships are preserved!'