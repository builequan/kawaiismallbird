import { getPayload } from 'payload'
import config from '@payload-config'

async function checkMediaReferences() {
  const payload = await getPayload({ config })

  // Get post 1731
  const post = await payload.findByID({
    collection: 'posts',
    id: 1731,
    depth: 0,
  })

  console.log('\n📊 Post:', post.title)
  console.log('\n🔍 Checking media references in content...\n')

  // Find all upload nodes
  const mediaIds: number[] = []
  const findMediaIds = (obj: any): void => {
    if (!obj) return

    if (typeof obj === 'object') {
      if (obj.type === 'upload' && obj.value) {
        mediaIds.push(typeof obj.value === 'number' ? obj.value : obj.value.id)
      }

      if (Array.isArray(obj)) {
        obj.forEach(findMediaIds)
      } else {
        Object.values(obj).forEach(findMediaIds)
      }
    }
  }

  findMediaIds(post.content)

  console.log(`Found ${mediaIds.length} media references:`, mediaIds)
  console.log('\n')

  // Check each media ID
  for (const mediaId of mediaIds) {
    try {
      const media = await payload.findByID({
        collection: 'media',
        id: mediaId,
        depth: 0,
      })

      console.log(`✅ Media ${mediaId}: ${media.filename}`)
    } catch (error) {
      console.log(`❌ Media ${mediaId}: NOT FOUND`)
    }
  }

  console.log('\n' + '='.repeat(50))
  process.exit(0)
}

checkMediaReferences()