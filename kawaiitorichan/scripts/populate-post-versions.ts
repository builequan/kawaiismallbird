import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Populate _posts_v (post versions) table for posts that don't have versions
 * This is necessary when posts are imported directly into the database
 * without going through PayloadCMS, which normally creates versions automatically
 */
async function populatePostVersions() {
  try {
    console.log('[Populate Versions] Starting...')

    const payload = await getPayload({ config: configPromise })
    const db = payload.db

    // Check current state
    const postsCountResult = await db.drizzle.execute(
      `SELECT COUNT(*) as count FROM posts`
    )
    const versionsCountResult = await db.drizzle.execute(
      `SELECT COUNT(*) as count FROM _posts_v`
    )

    const postsCount = postsCountResult.rows[0]?.count || 0
    const versionsCount = versionsCountResult.rows[0]?.count || 0

    console.log(`[Populate Versions] Current state:`)
    console.log(`  - Posts: ${postsCount}`)
    console.log(`  - Versions: ${versionsCount}`)

    // Find posts without versions
    const postsWithoutVersions = await db.drizzle.execute(`
      SELECT p.id, p.title
      FROM posts p
      LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
      WHERE v.id IS NULL
    `)

    const postsToFix = postsWithoutVersions.rows.length
    console.log(`[Populate Versions] Posts without versions: ${postsToFix}`)

    if (postsToFix === 0) {
      console.log('[Populate Versions] All posts already have versions!')
      process.exit(0)
    }

    console.log('[Populate Versions] Creating versions for posts...')

    // Step 1: Create version entries for posts without versions
    const insertVersionsResult = await db.drizzle.execute(`
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
        autosave
      )
      SELECT
        p.id,
        p.title,
        p.slug,
        p.slug_lock,
        p.content,
        p.excerpt,
        p.language::text::enum__posts_v_version_language,
        p.hero_image_id,
        p.hero_image_alt,
        p.published_at,
        p._status::text::enum__posts_v_version_status,
        p.updated_at,
        p.created_at,
        true,  -- marks this as the latest version
        false  -- not an autosave
      FROM posts p
      LEFT JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
      WHERE v.id IS NULL
    `)

    console.log(`[Populate Versions] Created ${postsToFix} version entries`)

    // Step 2: Copy relationships from posts_rels to _posts_v_rels
    console.log('[Populate Versions] Copying relationships to version table...')

    const insertRelsResult = await db.drizzle.execute(`
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
      )
    `)

    console.log('[Populate Versions] Relationships copied successfully')

    // Verify final state
    const finalVersionsResult = await db.drizzle.execute(
      `SELECT COUNT(*) as count FROM _posts_v`
    )
    const finalRelsResult = await db.drizzle.execute(
      `SELECT COUNT(*) as count FROM _posts_v_rels`
    )

    const finalVersionsCount = finalVersionsResult.rows[0]?.count || 0
    const finalRelsCount = finalRelsResult.rows[0]?.count || 0

    console.log(`\n[Populate Versions] Final state:`)
    console.log(`  - Posts: ${postsCount}`)
    console.log(`  - Versions: ${finalVersionsCount}`)
    console.log(`  - Version relationships: ${finalRelsCount}`)
    console.log(`\n✅ All posts now have versions and should be visible in admin panel!`)

    process.exit(0)
  } catch (error) {
    console.error('[Populate Versions] Error:', error)
    process.exit(1)
  }
}

populatePostVersions()