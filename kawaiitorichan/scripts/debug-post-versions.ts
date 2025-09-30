import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Debug script to check post versions data
 */
async function debugPostVersions() {
  try {
    console.log('[Debug Versions] Starting...')

    const payload = await getPayload({ config: configPromise })
    const db = payload.db

    // Check a sample post
    const samplePost = await db.drizzle.execute(`
      SELECT id, title, slug, _status
      FROM posts
      LIMIT 1
    `)

    if (samplePost.rows.length === 0) {
      console.log('[Debug Versions] No posts found!')
      process.exit(1)
    }

    const post = samplePost.rows[0]
    console.log('\n[Debug Versions] Sample post:')
    console.log(`  ID: ${post.id}`)
    console.log(`  Title: ${post.title}`)
    console.log(`  Slug: ${post.slug}`)
    console.log(`  Status: ${post._status}`)

    // Check its versions
    const versions = await db.drizzle.execute(`
      SELECT
        id,
        parent_id,
        version_title,
        version_slug,
        version__status,
        latest,
        autosave,
        created_at
      FROM _posts_v
      WHERE parent_id = ${post.id}
      ORDER BY created_at DESC
    `)

    console.log(`\n[Debug Versions] Found ${versions.rows.length} versions for this post`)

    versions.rows.forEach((version: any, index: number) => {
      console.log(`\nVersion ${index + 1}:`)
      console.log(`  ID: ${version.id}`)
      console.log(`  Parent ID: ${version.parent_id}`)
      console.log(`  Title: ${version.version_title}`)
      console.log(`  Slug: ${version.version_slug}`)
      console.log(`  Status: ${version.version__status}`)
      console.log(`  Latest: ${version.latest}`)
      console.log(`  Autosave: ${version.autosave}`)
      console.log(`  Created: ${version.created_at}`)
    })

    // Check if content exists
    const contentCheck = await db.drizzle.execute(`
      SELECT
        id,
        version_title,
        version_content IS NOT NULL as has_content,
        LENGTH(version_content::text) as content_length
      FROM _posts_v
      WHERE parent_id = ${post.id} AND latest = true
      LIMIT 1
    `)

    if (contentCheck.rows.length > 0) {
      const versionData = contentCheck.rows[0]
      console.log('\n[Debug Versions] Latest version content check:')
      console.log(`  Version ID: ${versionData.id}`)
      console.log(`  Has content: ${versionData.has_content}`)
      console.log(`  Content length: ${versionData.content_length} characters`)
    }

    // Check relationships
    const rels = await db.drizzle.execute(`
      SELECT
        r.id,
        r.path,
        r.categories_id,
        r.users_id,
        r.tags_id
      FROM _posts_v_rels r
      JOIN _posts_v v ON v.id = r.parent_id
      WHERE v.parent_id = ${post.id} AND v.latest = true
    `)

    console.log(`\n[Debug Versions] Found ${rels.rows.length} relationships for latest version`)
    rels.rows.forEach((rel: any, index: number) => {
      console.log(`\nRelationship ${index + 1}:`)
      console.log(`  Path: ${rel.path}`)
      console.log(`  Category ID: ${rel.categories_id || 'N/A'}`)
      console.log(`  User ID: ${rel.users_id || 'N/A'}`)
      console.log(`  Tag ID: ${rel.tags_id || 'N/A'}`)
    })

    // Summary statistics
    const stats = await db.drizzle.execute(`
      SELECT
        COUNT(*) as total_posts,
        (SELECT COUNT(*) FROM _posts_v) as total_versions,
        (SELECT COUNT(*) FROM _posts_v WHERE latest = true) as latest_versions,
        (SELECT COUNT(DISTINCT parent_id) FROM _posts_v) as posts_with_versions
      FROM posts
    `)

    console.log('\n[Debug Versions] Overall statistics:')
    const stat = stats.rows[0]
    console.log(`  Total posts: ${stat.total_posts}`)
    console.log(`  Total versions: ${stat.total_versions}`)
    console.log(`  Latest versions: ${stat.latest_versions}`)
    console.log(`  Posts with versions: ${stat.posts_with_versions}`)

    process.exit(0)
  } catch (error) {
    console.error('[Debug Versions] Error:', error)
    process.exit(1)
  }
}

debugPostVersions()