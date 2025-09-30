import { getPayload } from 'payload'
import config from '@payload-config'

async function fixHeroImages() {
  console.log('🖼️  Starting hero image fix...\n')

  const payload = await getPayload({ config })

  // Find all posts and filter those without hero images
  const { docs: allPosts } = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })

  // Filter posts without hero images
  const posts = allPosts.filter((post: any) => !post.heroImage)

  console.log(`📊 Found ${posts.length} posts without hero images\n`)

  let fixedFromContent = 0
  let fixedWithDefault = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      // Try to extract first image from content
      const firstImageId = extractFirstImageFromContent(post.content)

      if (firstImageId) {
        console.log(`📝 Setting hero image ${firstImageId} for post: ${post.title}`)

        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            heroImage: firstImageId,
          },
        })

        fixedFromContent++
        console.log(`✅ Updated post ${post.id} with image from content\n`)
      } else {
        // No image in content, use default image 904
        console.log(`📝 No image found in content for: ${post.title}`)
        console.log(`   Using default image 904`)

        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            heroImage: 904,
          },
        })

        fixedWithDefault++
        console.log(`✅ Updated post ${post.id} with default image\n`)
      }
    } catch (error) {
      console.error(`❌ Error updating post ${post.id}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✨ Hero image fix complete!`)
  console.log(`📊 Fixed from content: ${fixedFromContent} posts`)
  console.log(`📊 Fixed with default: ${fixedWithDefault} posts`)
  console.log(`❌ Errors: ${errorCount} posts`)
  console.log('='.repeat(50))

  process.exit(0)
}

function extractFirstImageFromContent(content: any): number | null {
  if (!content) return null

  // Recursively search for first upload node
  const findUpload = (obj: any): number | null => {
    if (!obj) return null

    if (typeof obj === 'object') {
      // Check if this is an upload node
      if (obj.type === 'upload' && obj.relationTo === 'media' && obj.value) {
        return typeof obj.value === 'number' ? obj.value : obj.value.id
      }

      // Search in arrays
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const result = findUpload(item)
          if (result) return result
        }
      } else {
        // Search in object properties
        for (const key in obj) {
          const result = findUpload(obj[key])
          if (result) return result
        }
      }
    }

    return null
  }

  return findUpload(content)
}

fixHeroImages().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})