import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Monitor the health of post versions to detect issues early
 * Run this regularly to catch problems before they affect users
 */
async function monitorVersionsHealth() {
  console.log('[Version Health Monitor] Starting check...')
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('=========================================')

  const payload = await getPayload({ config: configPromise })
  const db = payload.db

  let hasIssues = false

  try {
    // 1. Check for NULL parent_id (CRITICAL)
    console.log('\n[1] Checking for NULL parent_id...')
    const nullParentCheck = await db.drizzle.execute(`
      SELECT COUNT(*) as count
      FROM _posts_v
      WHERE parent_id IS NULL
    `)

    const nullCount = nullParentCheck.rows[0].count
    if (nullCount > 0) {
      console.log(`  ❌ CRITICAL: Found ${nullCount} versions with NULL parent_id`)
      console.log('     This will cause blank pages in admin panel!')
      hasIssues = true
    } else {
      console.log('  ✅ All versions have valid parent_id')
    }

    // 2. Check for posts without versions (WARNING)
    console.log('\n[2] Checking for posts without versions...')
    const missingVersionsCheck = await db.drizzle.execute(`
      SELECT COUNT(*) as count
      FROM posts p
      WHERE p.title IS NOT NULL
        AND p.title != ''
        AND NOT EXISTS (
          SELECT 1 FROM _posts_v v
          WHERE v.parent_id = p.id
          AND v.latest = true
        )
    `)

    const missingCount = missingVersionsCheck.rows[0].count
    if (missingCount > 0) {
      console.log(`  ⚠️  WARNING: Found ${missingCount} posts without versions`)
      console.log('     These posts won\'t be editable in admin panel')
      hasIssues = true
    } else {
      console.log('  ✅ All posts have at least one version')
    }

    // 3. Check for duplicate latest versions (ERROR)
    console.log('\n[3] Checking for duplicate latest versions...')
    const duplicateLatestCheck = await db.drizzle.execute(`
      SELECT parent_id, COUNT(*) as count
      FROM _posts_v
      WHERE latest = true
        AND parent_id IS NOT NULL
      GROUP BY parent_id
      HAVING COUNT(*) > 1
      LIMIT 10
    `)

    if (duplicateLatestCheck.rows.length > 0) {
      console.log(`  ❌ ERROR: Found ${duplicateLatestCheck.rows.length} posts with multiple latest versions`)
      for (const row of duplicateLatestCheck.rows) {
        console.log(`     Post ${row.parent_id}: ${row.count} latest versions`)
      }
      hasIssues = true
    } else {
      console.log('  ✅ No duplicate latest versions found')
    }

    // 4. Check for orphaned relationships (WARNING)
    console.log('\n[4] Checking for orphaned relationships...')
    const orphanedRelsCheck = await db.drizzle.execute(`
      SELECT COUNT(*) as count
      FROM _posts_v_rels vr
      WHERE NOT EXISTS (
        SELECT 1 FROM _posts_v v
        WHERE v.id = vr.parent_id
      )
    `)

    const orphanedCount = orphanedRelsCheck.rows[0].count
    if (orphanedCount > 0) {
      console.log(`  ⚠️  WARNING: Found ${orphanedCount} orphaned relationship records`)
      hasIssues = true
    } else {
      console.log('  ✅ No orphaned relationships')
    }

    // 5. Check content integrity (INFO)
    console.log('\n[5] Checking content integrity...')
    const contentCheck = await db.drizzle.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN version_content IS NULL THEN 1 END) as null_content,
        COUNT(CASE WHEN version_content::text NOT LIKE '%"root"%' THEN 1 END) as invalid_format,
        COUNT(CASE WHEN LENGTH(version_content::text) < 50 THEN 1 END) as too_short
      FROM _posts_v
      WHERE latest = true
    `)

    const content = contentCheck.rows[0]
    if (content.null_content > 0 || content.invalid_format > 0) {
      console.log(`  ⚠️  Content issues found:`)
      if (content.null_content > 0) console.log(`     - NULL content: ${content.null_content}`)
      if (content.invalid_format > 0) console.log(`     - Invalid Lexical format: ${content.invalid_format}`)
      if (content.too_short > 0) console.log(`     - Suspiciously short: ${content.too_short}`)
      hasIssues = true
    } else {
      console.log('  ✅ All content appears valid')
    }

    // 6. Version count statistics (INFO)
    console.log('\n[6] Version statistics...')
    const statsCheck = await db.drizzle.execute(`
      SELECT
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM _posts_v) as total_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true) as latest_versions,
        (SELECT COUNT(DISTINCT parent_id) FROM _posts_v WHERE parent_id IS NOT NULL) as versioned_posts,
        (SELECT MAX(version_count) FROM (
          SELECT COUNT(*) as version_count
          FROM _posts_v
          WHERE parent_id IS NOT NULL
          GROUP BY parent_id
        ) counts) as max_versions_per_post,
        (SELECT AVG(version_count)::numeric(10,2) FROM (
          SELECT COUNT(*) as version_count
          FROM _posts_v
          WHERE parent_id IS NOT NULL
          GROUP BY parent_id
        ) counts) as avg_versions_per_post
    `)

    const stats = statsCheck.rows[0]
    console.log('  📊 Statistics:')
    console.log(`     - Total posts: ${stats.total_posts}`)
    console.log(`     - Total versions: ${stats.total_versions}`)
    console.log(`     - Latest versions: ${stats.latest_versions}`)
    console.log(`     - Posts with versions: ${stats.versioned_posts}`)
    console.log(`     - Max versions per post: ${stats.max_versions_per_post || 0}`)
    console.log(`     - Avg versions per post: ${stats.avg_versions_per_post || 0}`)

    // 7. Check for version/post mismatch
    if (stats.total_posts !== stats.versioned_posts) {
      console.log(`\n  ⚠️  MISMATCH: ${stats.total_posts} posts but only ${stats.versioned_posts} have versions`)
      hasIssues = true
    }

    // Summary
    console.log('\n=========================================')
    if (hasIssues) {
      console.log('❌ ISSUES DETECTED!')
      console.log('\nRecommended actions:')
      console.log('1. Run: pnpm tsx scripts/fix-null-parent-versions.ts')
      console.log('2. Restart the application')
      console.log('3. Clear browser cache')
      process.exit(1) // Exit with error code for CI/CD
    } else {
      console.log('✅ All checks passed - versions are healthy!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Monitor error:', error)
    process.exit(1)
  }
}

monitorVersionsHealth()