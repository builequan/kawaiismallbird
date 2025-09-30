-- Populate _posts_v (post versions) table for posts that don't have versions
-- This is necessary when posts are imported directly into the database
-- without going through PayloadCMS, which normally creates versions automatically

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
INSERT INTO _posts_v (
  parent_id,
  version_title,
  version_slug,
  version_slug_lock,
  version_content,
  version_excerpt,
  version_language,
  version_hero_image_id,
  version_hero_image_alt,
  version_published_at,
  version__status,
  version_updated_at,
  version_created_at,
  latest,
  autosave,
  updated_at,
  created_at
)
SELECT
  p.id,
  p.title,
  p.slug,
  p.slug_lock,
  p.content,
  p.excerpt,
  CASE
    WHEN p.language IS NOT NULL THEN p.language::text::enum__posts_v_version_language
    ELSE 'ja'::enum__posts_v_version_language
  END,
  p.hero_image_id,
  p.hero_image_alt,
  p.published_at,
  CASE
    WHEN p._status IS NOT NULL THEN p._status::text::enum__posts_v_version_status
    ELSE 'published'::enum__posts_v_version_status
  END,
  p.updated_at,
  p.created_at,
  true,  -- marks this as the latest version
  false, -- not an autosave
  p.updated_at,
  p.created_at
FROM posts p
LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
WHERE v.id IS NULL;

\echo 'Version entries created'
\echo ''

-- Step 3: Copy relationships from posts_rels to _posts_v_rels
\echo 'Copying relationships to version table...'

INSERT INTO _posts_v_rels (
  "order",
  parent_id,
  path,
  posts_id,
  categories_id,
  users_id,
  tags_id
)
SELECT
  pr."order",
  pv.id,
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
JOIN _posts_v pv ON pv.parent_id = pr.parent_id
WHERE pv.latest = true
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

-- Step 4: Show final state
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
  CONCAT('  Version relationships: ', COUNT(*))
FROM _posts_v_rels;

\echo ''
\echo '✅ All posts now have versions and should be visible in admin panel!'