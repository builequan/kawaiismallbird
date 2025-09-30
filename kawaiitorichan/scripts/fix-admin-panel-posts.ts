import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Fix posts to ensure they display properly in the admin panel
 * This script addresses common issues that cause blank screens when clicking on posts
 */
async function fixAdminPanelPosts() {
  console.log('[Fix Admin Panel] Starting...')

  const payload = await getPayload({ config: configPromise })
  const db = payload.db

  try {
    // 1. First, ensure all posts have proper versions
    console.log('\n[Step 1] Checking for posts without versions...')
    const postsWithoutVersions = await db.drizzle.execute(`
      SELECT p.id, p.title
      FROM posts p
      LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
      WHERE v.id IS NULL
    `)

    if (postsWithoutVersions.rows.length > 0) {
      console.log(`Found ${postsWithoutVersions.rows.length} posts without versions. Creating versions...`)

      // Create versions for posts that don't have them
      await db.drizzle.execute(`
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
          version_wordpress_metadata_original_author,
          version_wordpress_metadata_original_date,
          version_wordpress_metadata_modified_date,
          version_wordpress_metadata_status,
          version_wordpress_metadata_enable_comments,
          version_wordpress_metadata_enable_toc,
          version_meta_title,
          version_meta_description,
          version_meta_keywords,
          version_meta_focus_keyphrase,
          version_meta_image_id,
          latest,
          autosave
        )
        SELECT
          p.id,
          p.title,
          p.slug,
          p.slug_lock,
          p.content,
          p.excerpt,
          COALESCE(p.language::text::enum__posts_v_version_language, 'ja'::enum__posts_v_version_language),
          p.hero_image_id,
          p.hero_image_alt,
          p.published_at,
          COALESCE(p._status::text::enum__posts_v_version_status, 'draft'::enum__posts_v_version_status),
          p.updated_at,
          p.created_at,
          p.wordpress_metadata_original_author,
          p.wordpress_metadata_original_date,
          p.wordpress_metadata_modified_date,
          p.wordpress_metadata_status,
          p.wordpress_metadata_enable_comments,
          p.wordpress_metadata_enable_toc,
          p.meta_title,
          p.meta_description,
          p.meta_keywords,
          p.meta_focus_keyphrase,
          p.meta_image_id,
          true,  -- latest
          false  -- not an autosave
        FROM posts p
        LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
        WHERE v.id IS NULL
        ON CONFLICT DO NOTHING
      `)

      console.log('✅ Versions created successfully')
    } else {
      console.log('✅ All posts already have versions')
    }

    // 2. Copy relationships to version tables
    console.log('\n[Step 2] Ensuring version relationships are properly populated...')

    await db.drizzle.execute(`
      INSERT INTO _posts_v_rels (
        "order",
        parent_id,
        path,
        posts_id,
        categories_id,
        users_id,
        tags_id
      )
      SELECT DISTINCT
        pr."order",
        pv.id,
        pr.path,
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
        AND vr.path = pr.path
        AND COALESCE(vr.categories_id, 0) = COALESCE(pr.categories_id, 0)
        AND COALESCE(vr.users_id, 0) = COALESCE(pr.users_id, 0)
        AND COALESCE(vr.tags_id, 0) = COALESCE(pr.tags_id, 0)
        AND COALESCE(vr.posts_id, 0) = COALESCE(pr.posts_id, 0)
      )
    `)

    console.log('✅ Version relationships updated')

    // 3. Ensure proper content structure
    console.log('\n[Step 3] Checking content structure...')

    const invalidContent = await db.drizzle.execute(`
      SELECT id, title
      FROM posts
      WHERE content IS NOT NULL
      AND (
        content::text NOT LIKE '%"root"%'
        OR content::text NOT LIKE '%"type":"root"%'
      )
    `)

    if (invalidContent.rows.length > 0) {
      console.log(`⚠️  Found ${invalidContent.rows.length} posts with potentially invalid content structure`)
      console.log('These posts may need manual review or re-import')
    } else {
      console.log('✅ All posts have valid content structure')
    }

    // 4. Clean up orphaned authors
    console.log('\n[Step 4] Cleaning up orphaned author relationships...')

    await db.drizzle.execute(`
      DELETE FROM posts_rels
      WHERE path = 'authors'
      AND users_id IS NOT NULL
      AND users_id NOT IN (SELECT id FROM users)
    `)

    console.log('✅ Cleaned up orphaned author relationships')

    // 5. Get statistics
    const stats = await db.drizzle.execute(`
      SELECT
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true) as posts_with_versions,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM categories) as total_categories
    `)

    console.log('\n[Summary]')
    console.log('==========')
    const stat = stats.rows[0]
    console.log(`Total posts: ${stat.total_posts}`)
    console.log(`Posts with versions: ${stat.posts_with_versions}`)
    console.log(`Total users: ${stat.total_users}`)
    console.log(`Total categories: ${stat.total_categories}`)

    if (stat.total_users === 0) {
      console.log('\n⚠️  Warning: No users found in database.')
      console.log('You may need to create an admin user first.')
    }

    console.log('\n✅ Admin panel posts fix completed!')
    console.log('Please restart your development server and try accessing posts in the admin panel.')

    process.exit(0)
  } catch (error) {
    console.error('[Fix Admin Panel] Error:', error)
    process.exit(1)
  }
}

fixAdminPanelPosts()