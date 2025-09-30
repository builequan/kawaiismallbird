import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Fix media URLs pointing to external domains instead of local paths
 *
 * THE PROBLEM:
 * - Media records have external URLs (https://im.runware.ai/...)
 * - Image files exist locally in /app/public/media/
 * - Frontend can't access images because URLs point to wrong domain
 * - Hero images show broken image icons
 *
 * THE ROOT CAUSE:
 * - Images were imported from external source
 * - URL field was set to external domain during import
 * - Files were downloaded locally but database wasn't updated
 *
 * THE SOLUTION:
 * 1. Update main url field: /api/media/file/{filename}
 * 2. Update 8 size variant URLs:
 *    - thumbnail_u_r_l (main thumbnail)
 *    - sizes_thumbnail_url (300x300)
 *    - sizes_square_url (500x500)
 *    - sizes_small_url (600px width)
 *    - sizes_medium_url (900px width)
 *    - sizes_large_url (1200px width)
 *    - sizes_xlarge_url (1920px width)
 *    - sizes_og_url (1200x630 for Open Graph)
 * 3. Handle NULL filenames properly with CASE statements
 * 4. Verify all URLs are using local paths
 */
async function fixMediaUrls() {
  console.log('[Fix Media URLs] Starting...')
  console.log('=====================================')

  const payload = await getPayload({ config: configPromise })
  const db = payload.db

  try {
    // Step 1: Diagnose current situation
    console.log('\n[DIAGNOSIS] Checking media URL status...')

    const diagnostics = await db.drizzle.execute(`
      SELECT
        COUNT(*) as total_media,
        COUNT(*) FILTER (WHERE url LIKE 'https://%' OR url LIKE 'http://%') as external_urls,
        COUNT(*) FILTER (WHERE url LIKE '/api/media/%') as local_urls,
        COUNT(*) FILTER (WHERE url IS NULL) as null_urls,
        COUNT(*) FILTER (WHERE sizes_thumbnail_url IS NOT NULL) as with_thumbnail_urls,
        COUNT(*) FILTER (WHERE sizes_thumbnail_filename IS NOT NULL) as with_thumbnail_files
      FROM media
    `)

    const stats = diagnostics.rows[0]
    console.log('\nCurrent Status:')
    console.log(`  Total media: ${stats.total_media}`)
    console.log(`  External URLs: ${stats.external_urls} (https:// or http://)`)
    console.log(`  Local URLs: ${stats.local_urls} (/api/media/...)`)
    console.log(`  NULL URLs: ${stats.null_urls}`)
    console.log(`  With thumbnail URLs: ${stats.with_thumbnail_urls}`)
    console.log(`  With thumbnail files: ${stats.with_thumbnail_files}`)

    if (stats.external_urls > 0) {
      console.log('\n⚠️  PROBLEM DETECTED: Media URLs pointing to external domains!')
      console.log('Images won\'t display because they\'re not accessible.')

      // Step 2: Update main URL field
      console.log('\n[STEP 1] Updating main image URLs...')

      const updateMainResult = await db.drizzle.execute(`
        UPDATE media
        SET url = '/api/media/file/' || filename
        WHERE (url LIKE 'https://%' OR url LIKE 'http://%')
          AND filename IS NOT NULL
      `)

      console.log(`✅ Updated main URLs for ${stats.external_urls} media records`)

      // Step 3: Update all size variant URLs
      console.log('\n[STEP 2] Updating thumbnail and size variant URLs...')

      const updateVariantsResult = await db.drizzle.execute(`
        UPDATE media
        SET
          thumbnail_u_r_l = CASE
            WHEN sizes_thumbnail_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_thumbnail_filename
            ELSE NULL
          END,
          sizes_thumbnail_url = CASE
            WHEN sizes_thumbnail_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_thumbnail_filename
            ELSE NULL
          END,
          sizes_square_url = CASE
            WHEN sizes_square_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_square_filename
            ELSE NULL
          END,
          sizes_small_url = CASE
            WHEN sizes_small_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_small_filename
            ELSE NULL
          END,
          sizes_medium_url = CASE
            WHEN sizes_medium_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_medium_filename
            ELSE NULL
          END,
          sizes_large_url = CASE
            WHEN sizes_large_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_large_filename
            ELSE NULL
          END,
          sizes_xlarge_url = CASE
            WHEN sizes_xlarge_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_xlarge_filename
            ELSE NULL
          END,
          sizes_og_url = CASE
            WHEN sizes_og_filename IS NOT NULL
            THEN '/api/media/file/' || sizes_og_filename
            ELSE NULL
          END
        WHERE filename IS NOT NULL
      `)

      console.log('✅ Updated all size variant URLs')
    } else {
      console.log('\n✅ All media URLs already using local paths')
    }

    // Step 4: Verify the fix
    console.log('\n[VERIFICATION] Final media URL status...')

    const finalDiagnostics = await db.drizzle.execute(`
      SELECT
        COUNT(*) as total_media,
        COUNT(*) FILTER (WHERE url LIKE 'https://%' OR url LIKE 'http://%') as external_urls,
        COUNT(*) FILTER (WHERE url LIKE '/api/media/%') as local_urls,
        COUNT(*) FILTER (WHERE sizes_thumbnail_url IS NOT NULL) as with_thumbnail_urls,
        COUNT(*) FILTER (WHERE sizes_square_url IS NOT NULL) as with_square_urls,
        COUNT(*) FILTER (WHERE sizes_medium_url IS NOT NULL) as with_medium_urls,
        COUNT(*) FILTER (WHERE sizes_large_url IS NOT NULL) as with_large_urls
      FROM media
    `)

    const final = finalDiagnostics.rows[0]
    console.log('\nFinal Status:')
    console.log(`  ✅ Total media: ${final.total_media}`)
    console.log(`  ✅ Local URLs: ${final.local_urls}`)
    console.log(`  ✅ External URLs remaining: ${final.external_urls}`)
    console.log(`  ✅ Thumbnail URLs: ${final.with_thumbnail_urls}`)
    console.log(`  ✅ Square URLs: ${final.with_square_urls}`)
    console.log(`  ✅ Medium URLs: ${final.with_medium_urls}`)
    console.log(`  ✅ Large URLs: ${final.with_large_urls}`)

    // Sample check - verify a specific media record
    const sampleCheck = await db.drizzle.execute(`
      SELECT
        id,
        filename,
        url,
        thumbnail_u_r_l,
        sizes_thumbnail_url,
        sizes_medium_url
      FROM media
      WHERE url IS NOT NULL
      ORDER BY id
      LIMIT 3
    `)

    console.log('\n[SAMPLE CHECK] First 3 media records:')
    for (const media of sampleCheck.rows) {
      console.log(`\nMedia ID: ${media.id}`)
      console.log(`  Filename: ${media.filename}`)
      console.log(`  Main URL: ${media.url}`)
      console.log(`  Thumbnail: ${media.thumbnail_u_r_l || 'N/A'}`)
      console.log(`  Sizes Thumbnail: ${media.sizes_thumbnail_url || 'N/A'}`)
      console.log(`  Sizes Medium: ${media.sizes_medium_url || 'N/A'}`)
    }

    // Check for any remaining issues
    if (final.external_urls > 0) {
      console.log('\n⚠️  WARNING: Still have media with external URLs!')
      console.log('This may need manual investigation.')
    } else {
      console.log('\n🎉 SUCCESS! All media URLs now use local paths.')
      console.log('Images should display correctly in the frontend.')
    }

    console.log('\n=====================================')
    console.log('Fix completed! Please:')
    console.log('1. Restart your development server (or Docker container)')
    console.log('2. Clear browser cache')
    console.log('3. Check that hero images display correctly')
    console.log('\nIf using Docker/Dokploy, restart the container:')
    console.log('  docker restart <container-name>')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  }
}

fixMediaUrls()