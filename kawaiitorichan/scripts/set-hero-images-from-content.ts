import { getPayload } from 'payload'
import config from '../src/payload.config'

const extractFirstImageFromContent = (content: any): number | null => {
  try {
    // Check if content has the proper Lexical structure
    if (!content || !content.root || !content.root.children) {
      return null
    }

    // Traverse the content to find the first upload node
    const findFirstUpload = (node: any): number | null => {
      if (!node) return null

      // Check if this is an upload node
      if (node.type === 'upload' && node.relationTo === 'media' && node.value) {
        // Handle both object and direct number formats
        if (typeof node.value === 'object' && node.value?.id) {
          return node.value.id
        } else if (typeof node.value === 'number') {
          return node.value
        }
      }

      // Recursively check children
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const result = findFirstUpload(child)
          if (result) return result
        }
      }

      return null
    }

    return findFirstUpload(content.root)
  } catch (error) {
    console.error('Error extracting image:', error)
  }

  return null
}

const run = async () => {
  try {
    const payload = await getPayload({ config })

    // Get all posts without hero images
    const { docs: posts } = await payload.find({
      collection: 'posts',
      where: {
        heroImage: {
          exists: false
        }
      },
      limit: 200, // Process in batches
      depth: 2
    })

    console.log(`Found ${posts.length} posts without hero images`)

    let updatedCount = 0
    let failedCount = 0

    for (const post of posts) {
      const firstImageId = extractFirstImageFromContent(post.content)

      if (firstImageId) {
        try {
          // Verify the media item exists
          const media = await payload.findByID({
            collection: 'media',
            id: firstImageId,
            depth: 0
          })

          if (media) {
            // Update the post with the hero image
            await payload.update({
              collection: 'posts',
              id: post.id,
              data: {
                heroImage: firstImageId,
                heroImageAlt: post.title // Use post title as alt text
              }
            })

            updatedCount++
            console.log(`✅ Updated "${post.title}" with hero image (Media ID: ${firstImageId})`)
          } else {
            console.log(`⚠️  Media ID ${firstImageId} not found for post "${post.title}"`)
            failedCount++
          }
        } catch (error) {
          console.error(`❌ Failed to update post "${post.title}":`, error.message)
          failedCount++
        }
      } else {
        console.log(`ℹ️  No images found in content for "${post.title}"`)
      }
    }

    console.log('\n=== Summary ===')
    console.log(`Total posts processed: ${posts.length}`)
    console.log(`Successfully updated: ${updatedCount}`)
    console.log(`Failed updates: ${failedCount}`)
    console.log(`Posts without images: ${posts.length - updatedCount - failedCount}`)

  } catch (error) {
    console.error('Error setting hero images:', error)
  }
}

run()