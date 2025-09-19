import { getPayload } from 'payload'
import config from '../src/payload.config'

const run = async () => {
  try {
    const payload = await getPayload({ config })

    // Count posts with hero images
    const { totalDocs: postsWithHero } = await payload.find({
      collection: 'posts',
      where: {
        heroImage: {
          exists: true
        }
      },
      limit: 1
    })

    // Count posts without hero images
    const { totalDocs: postsWithoutHero } = await payload.find({
      collection: 'posts',
      where: {
        heroImage: {
          exists: false
        }
      },
      limit: 1
    })

    // Get total posts
    const { totalDocs: totalPosts } = await payload.find({
      collection: 'posts',
      limit: 1
    })

    console.log('\n=== Hero Image Status ===')
    console.log(`Total posts: ${totalPosts}`)
    console.log(`Posts WITH hero images: ${postsWithHero}`)
    console.log(`Posts WITHOUT hero images: ${postsWithoutHero}`)
    console.log(`Percentage with hero images: ${((postsWithHero / totalPosts) * 100).toFixed(1)}%`)

    // Sample some posts with hero images
    const { docs: samplePosts } = await payload.find({
      collection: 'posts',
      where: {
        heroImage: {
          exists: true
        }
      },
      limit: 5,
      depth: 2
    })

    console.log('\n=== Sample Posts with Hero Images ===')
    for (const post of samplePosts) {
      const heroImage = post.heroImage
      const imageId = typeof heroImage === 'object' ? heroImage?.id : heroImage
      console.log(`- ${post.title}`)
      console.log(`  Hero Image ID: ${imageId}`)
      console.log(`  Hero Image Alt: ${post.heroImageAlt || 'N/A'}`)
    }

  } catch (error) {
    console.error('Error verifying hero images:', error)
  }
}

run()