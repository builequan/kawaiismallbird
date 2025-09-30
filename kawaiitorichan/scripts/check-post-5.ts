import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkPost5() {
  console.log('[Check Post 5] Starting...')

  const payload = await getPayload({ config: configPromise })

  // Check if post 5 exists
  const postResult = await payload.db.drizzle.execute('SELECT id, title, slug, _status FROM posts WHERE id = 5')
  console.log('Post 5:', postResult.rows[0] || 'NOT FOUND')

  // Check versions for post 5
  const versionsResult = await payload.db.drizzle.execute('SELECT id, parent_id, version_title, latest FROM _posts_v WHERE parent_id = 5')
  console.log('\nVersions for post 5:', versionsResult.rows.length > 0 ? versionsResult.rows : 'NO VERSIONS')

  // Check locales
  const localesResult = await payload.db.drizzle.execute(`
    SELECT _locale, wordpress_metadata_original_author, wordpress_metadata_status
    FROM posts_locales
    WHERE _parent_id = 5
    LIMIT 1
  `)
  console.log('\nLocales for post 5:', localesResult.rows.length > 0 ? localesResult.rows : 'NO LOCALES')

  // Check version locales
  const versionLocalesResult = await payload.db.drizzle.execute(`
    SELECT vl._locale, vl.version_wordpress_metadata_original_author
    FROM _posts_v_locales vl
    JOIN _posts_v v ON vl._parent_id = v.id
    WHERE v.parent_id = 5 AND v.latest = true
    LIMIT 1
  `)
  console.log('\nVersion locales for post 5:', versionLocalesResult.rows.length > 0 ? versionLocalesResult.rows : 'NO VERSION LOCALES')

  process.exit(0)
}

checkPost5().catch((error) => {
  console.error('[Check Post 5] Error:', error)
  process.exit(1)
})