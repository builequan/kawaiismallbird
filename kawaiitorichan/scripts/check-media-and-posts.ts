import { getPayload } from 'payload'
import config from '../src/payload.config'

const run = async () => {
  try {
    const payload = await getPayload({ config })

    // Check media collection
    const { docs: media, totalDocs: totalMedia } = await payload.find({
      collection: 'media',
      limit: 10,
      depth: 0
    })

    console.log('\n=== Media Collection ===')
    console.log('Total media items:', totalMedia)
    console.log('\nFirst 10 media items:')
    media.forEach(item => {
      console.log(`  - ${item.filename} (ID: ${item.id})`)
    })

    // Check posts with hero images
    const { docs: postsWithHero } = await payload.find({
      collection: 'posts',
      where: {
        heroImage: {
          exists: true
        }
      },
      limit: 10,
      depth: 2
    })

    console.log('\n=== Posts with Hero Images ===')
    console.log('Total posts with hero images:', postsWithHero.length)
    postsWithHero.forEach(post => {
      console.log(`  - ${post.title} (Hero Image ID: ${typeof post.heroImage === 'object' ? post.heroImage?.id : post.heroImage})`)
    })

    // Check total posts
    const { totalDocs: totalPosts } = await payload.find({
      collection: 'posts',
      limit: 1
    })
    console.log('\nTotal posts in database:', totalPosts)

    // Try to find posts that have images in their content
    const { docs: samplePosts } = await payload.find({
      collection: 'posts',
      limit: 5,
      depth: 2
    })

    console.log('\n=== Checking for images in content ===')
    for (const post of samplePosts) {
      console.log(`\n${post.title}:`)

      // Check if content has any upload nodes (images)
      const contentStr = JSON.stringify(post.content)
      const hasUploadNodes = contentStr.includes('"type":"upload"')
      console.log('  Has images in content:', hasUploadNodes)

      if (hasUploadNodes && !post.heroImage) {
        // Extract first image from content if exists
        const matches = contentStr.match(/"type":"upload","relationTo":"media","value":(\d+)/g)
        if (matches && matches.length > 0) {
          const firstImageId = matches[0].match(/"value":(\d+)/)?.[1]
          console.log('  First image ID in content:', firstImageId)
          console.log('  Could be used as hero image!')
        }
      }
    }

  } catch (error) {
    console.error('Error checking media and posts:', error)
  }
}

run()