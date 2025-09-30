import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Fix posts versions with NULL parent_id that cause blank admin panel pages
 *
 * THE PROBLEM:
 * - Versions in _posts_v table lost their parent_id values (became NULL)
 * - PayloadCMS admin panel loads version data, not post data directly
 * - Without parent_id, versions can't be linked to posts = blank pages
 *
 * ROOT CAUSE:
 * - PayloadCMS APPLICATION CLEARS parent_id when running!
 * - Creating versions with the app running → parent_id becomes NULL
 * - Creating versions with the app stopped → parent_id stays correct
 *
 * THE SOLUTION:
 * 1. STOP THE APPLICATION FIRST (critical!)
 * 2. Delete all broken versions with NULL parent_id
 * 3. Recreate proper versions with ALL 37 fields mapped
 * 4. Recreate relationship records (parent_id points to _posts_v.id, not posts.id!)
 * 5. Verify everything is fixed
 * 6. START THE APPLICATION
 *
 * WARNING: If you run this with the app running, parent_id may become NULL again!
 * For production: Stop Docker container → Run this script → Start container
 */
async function fixNullParentVersions() {
  console.log('[Fix NULL Parent Versions] Starting...')
  console.log('=====================================')

  const payload = await getPayload({ config: configPromise })
  const db = payload.db

  try {
    // Step 0: Diagnose the current situation
    console.log('\n[DIAGNOSIS] Checking current database state...')

    const diagnostics = await db.drizzle.execute(`
      SELECT
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE title IS NOT NULL AND title != '') as valid_posts,
        (SELECT COUNT(*) FROM _posts_v) as total_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL) as null_parent_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NOT NULL) as valid_versions,
        (SELECT COUNT(DISTINCT parent_id) FROM _posts_v WHERE parent_id IS NOT NULL) as linked_posts,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true) as latest_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true AND parent_id IS NULL) as broken_latest_versions
    `)

    const stats = diagnostics.rows[0]
    console.log('\nCurrent Status:')
    console.log(`  Posts: ${stats.total_posts} total (${stats.valid_posts} valid)`)
    console.log(`  Versions: ${stats.total_versions} total`)
    console.log(`  ❌ NULL parent_id: ${stats.null_parent_versions} versions`)
    console.log(`  ✅ Valid parent_id: ${stats.valid_versions} versions`)
    console.log(`  📎 Linked to posts: ${stats.linked_posts} posts`)
    console.log(`  🔄 Latest versions: ${stats.latest_versions} (${stats.broken_latest_versions} broken)`)

    if (stats.null_parent_versions > 0) {
      console.log('\n⚠️  PROBLEM DETECTED: Found versions with NULL parent_id!')
      console.log('This causes blank pages in the admin panel.')

      // Step 1: Delete broken versions
      console.log('\n[STEP 1] Deleting broken versions with NULL parent_id...')

      const deleteResult = await db.drizzle.execute(`
        DELETE FROM _posts_v WHERE parent_id IS NULL
      `)

      console.log(`✅ Deleted ${stats.null_parent_versions} broken versions`)

      // Also clean up orphaned relationships
      console.log('\n[CLEANUP] Removing orphaned version relationships...')
      await db.drizzle.execute(`
        DELETE FROM _posts_v_rels
        WHERE parent_id NOT IN (SELECT id FROM _posts_v)
      `)
      console.log('✅ Cleaned up orphaned relationships')
    } else {
      console.log('\n✅ No broken versions found (parent_id is not NULL)')
    }

    // Step 2: Find posts without versions and create them
    console.log('\n[STEP 2] Finding posts without versions...')

    const postsWithoutVersions = await db.drizzle.execute(`
      SELECT p.id, p.title
      FROM posts p
      LEFT JOIN _posts_v pv ON pv.parent_id = p.id AND pv.latest = true
      WHERE p.title IS NOT NULL
        AND p.title <> ''
        AND pv.id IS NULL
      ORDER BY p.id
    `)

    if (postsWithoutVersions.rows.length > 0) {
      console.log(`Found ${postsWithoutVersions.rows.length} posts without versions`)
      console.log('Creating versions for these posts...')

      // Create versions with ALL 37 fields properly mapped
      // CRITICAL: This must be done with the app stopped, or PayloadCMS will clear parent_id!
      const insertResult = await db.drizzle.execute(`
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
          version_meta_title,
          version_meta_image_id,
          version_meta_description,
          version_meta_keywords,
          version_meta_focus_keyphrase,
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
          version_internal_links_metadata_version,
          version_internal_links_metadata_last_processed,
          version_internal_links_metadata_content_hash,
          version_affiliate_links_metadata_version,
          version_affiliate_links_metadata_last_processed,
          version_affiliate_links_metadata_content_hash,
          version_affiliate_links_metadata_exclude_from_affiliates,
          version_content_db_meta_original_id,
          version_content_db_meta_website_id,
          version_content_db_meta_language,
          version_content_db_meta_imported_at,
          latest,
          autosave
        )
        SELECT
          p.id, -- parent_id = posts.id ✅ CRITICAL
          p.title,
          p.slug,
          p.slug_lock,
          p.content,
          p.excerpt,
          CASE
            WHEN p.language = 'ja' THEN 'ja'::enum__posts_v_version_language
            WHEN p.language = 'en' THEN 'en'::enum__posts_v_version_language
            ELSE 'ja'::enum__posts_v_version_language
          END,
          p.hero_image_id,
          p.hero_image_alt,
          p.meta_title,
          p.meta_image_id,
          p.meta_description,
          p.meta_keywords,
          p.meta_focus_keyphrase,
          p.published_at,
          CASE
            WHEN p._status = 'published' THEN 'published'::enum__posts_v_version_status
            ELSE 'draft'::enum__posts_v_version_status
          END,
          COALESCE(p.updated_at, NOW()),
          COALESCE(p.created_at, NOW()),
          p.wordpress_metadata_original_author,
          p.wordpress_metadata_original_date,
          p.wordpress_metadata_modified_date,
          CASE
            WHEN p.wordpress_metadata_status = 'published' THEN 'published'::enum__posts_v_version_wordpress_metadata_status
            WHEN p.wordpress_metadata_status = 'draft' THEN 'draft'::enum__posts_v_version_wordpress_metadata_status
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
          true,  -- latest
          false  -- not an autosave
        FROM posts p
        LEFT JOIN _posts_v pv ON pv.parent_id = p.id AND pv.latest = true
        WHERE p.title IS NOT NULL
          AND p.title <> ''
          AND pv.id IS NULL
      `)

      console.log(`✅ Created ${postsWithoutVersions.rows.length} new versions`)
    } else {
      console.log('✅ All posts already have versions')
    }

    // Step 3: Recreate relationships
    console.log('\n[STEP 3] Recreating version relationships...')

    // First, check what relationships need to be created
    const missingRels = await db.drizzle.execute(`
      SELECT COUNT(*) as missing_count
      FROM posts_rels pr
      JOIN _posts_v pv ON pv.parent_id = pr.parent_id AND pv.latest = true
      WHERE NOT EXISTS (
        SELECT 1 FROM _posts_v_rels vr
        WHERE vr.parent_id = pv.id
        AND vr.path = pr.path
        AND (
          (pr.categories_id IS NOT NULL AND vr.categories_id = pr.categories_id) OR
          (pr.users_id IS NOT NULL AND vr.users_id = pr.users_id) OR
          (pr.tags_id IS NOT NULL AND vr.tags_id = pr.tags_id) OR
          (pr.posts_id IS NOT NULL AND vr.posts_id = pr.posts_id)
        )
      )
    `)

    if (missingRels.rows[0].missing_count > 0) {
      console.log(`Found ${missingRels.rows[0].missing_count} missing relationships`)

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
        SELECT
          pr."order",
          pv.id, -- ✅ CRITICAL: parent_id points to _posts_v.id, NOT posts.id!
          pr.path,
          pr.posts_id,
          pr.categories_id,
          pr.users_id,
          pr.tags_id
        FROM posts_rels pr
        JOIN _posts_v pv ON pv.parent_id = pr.parent_id -- Link via parent_id
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

      console.log('✅ Created missing relationships')
    } else {
      console.log('✅ All relationships already exist')
    }

    // Step 4: Final verification
    console.log('\n[VERIFICATION] Final database state...')

    const finalDiagnostics = await db.drizzle.execute(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE title IS NOT NULL AND title != '') as valid_posts,
        (SELECT COUNT(*) FROM _posts_v) as total_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NULL) as null_parent_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE parent_id IS NOT NULL) as valid_versions,
        (SELECT COUNT(DISTINCT parent_id) FROM _posts_v WHERE parent_id IS NOT NULL) as linked_posts,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true) as latest_versions,
        (SELECT COUNT(*) FROM _posts_v_rels) as total_relationships
    `)

    const final = finalDiagnostics.rows[0]
    console.log('\nFinal Status:')
    console.log(`  ✅ Valid posts: ${final.valid_posts}`)
    console.log(`  ✅ Total versions: ${final.total_versions}`)
    console.log(`  ✅ Valid versions: ${final.valid_versions} (${final.null_parent_versions} NULL)`)
    console.log(`  ✅ Posts with versions: ${final.linked_posts}`)
    console.log(`  ✅ Latest versions: ${final.latest_versions}`)
    console.log(`  ✅ Relationships: ${final.total_relationships}`)

    // Check for any remaining issues
    if (final.null_parent_versions > 0) {
      console.log('\n⚠️  WARNING: Still have versions with NULL parent_id!')
      console.log('This needs manual investigation.')
    } else if (final.valid_posts !== final.linked_posts) {
      console.log(`\n⚠️  WARNING: Mismatch - ${final.valid_posts} posts but only ${final.linked_posts} have versions`)
      console.log('Some posts may still not have versions.')
    } else {
      console.log('\n🎉 SUCCESS! All posts have valid versions with proper parent_id.')
      console.log('The admin panel should now work correctly.')
    }

    // Sample verification - check a specific post
    const sampleCheck = await db.drizzle.execute(`
      SELECT
        p.id as post_id,
        p.title,
        v.id as version_id,
        v.parent_id,
        v.version_title,
        LENGTH(v.version_content::text) as content_length
      FROM posts p
      JOIN _posts_v v ON v.parent_id = p.id AND v.latest = true
      WHERE p.id = (SELECT MIN(id) FROM posts WHERE title IS NOT NULL)
    `)

    if (sampleCheck.rows.length > 0) {
      const sample = sampleCheck.rows[0]
      console.log('\n[SAMPLE CHECK] First post:')
      console.log(`  Post ID: ${sample.post_id}`)
      console.log(`  Title: ${sample.title}`)
      console.log(`  Version ID: ${sample.version_id}`)
      console.log(`  Parent ID: ${sample.parent_id} ✅`)
      console.log(`  Content: ${sample.content_length} characters`)
    }

    console.log('\n=====================================')
    console.log('Fix completed! Please:')
    console.log('1. Restart your development server')
    console.log('2. Clear browser cache')
    console.log('3. Try accessing posts in the admin panel')
    console.log('\nIf using Docker/Dokploy, restart the container:')
    console.log('  docker restart <container-name>')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  }
}

fixNullParentVersions()