import { getPayload } from 'payload'
import config from '../src/payload.config'
import path from 'path'
import fs from 'fs/promises'

const run = async () => {
  try {
    const payload = await getPayload({ config })

    // Load similarity matrix
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    const similarityContent = await fs.readFile(similarityPath, 'utf-8')
    const similarityData = JSON.parse(similarityContent)

    // Take a sample post and check its related posts
    const { docs: samplePosts } = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1,
      depth: 2
    })

    if (samplePosts.length === 0) {
      console.log('No posts found')
      return
    }

    const samplePost = samplePosts[0]
    console.log('\n=== Checking Post:', samplePost.title)
    console.log('Post ID:', samplePost.id)
    console.log('Has Hero Image:', !!samplePost.heroImage)

    // Check similar posts
    const postSimilarities = similarityData.similarities[String(samplePost.id)]
    if (postSimilarities && postSimilarities.similar) {
      const topSimilar = postSimilarities.similar
        .filter(post => post.score >= 0.65)
        .slice(0, 3)

      console.log('\n=== Similar Posts Found:', topSimilar.length)

      // Fetch the actual post data for the similar posts
      const { docs: similarPostsData } = await payload.find({
        collection: 'posts',
        where: {
          id: {
            in: topSimilar.map(p => typeof p.id === 'string' ? parseInt(p.id) : p.id)
          },
          _status: {
            equals: 'published'
          }
        },
        limit: 3,
        depth: 2
      })

      console.log('\n=== Fetched Similar Posts:', similarPostsData.length)

      for (const relatedPost of similarPostsData) {
        console.log('\n--- Related Post:', relatedPost.title)
        console.log('  ID:', relatedPost.id)
        console.log('  Has Hero Image:', !!relatedPost.heroImage)
        console.log('  Hero Image Type:', typeof relatedPost.heroImage)

        if (relatedPost.heroImage) {
          console.log('  Hero Image Value:', JSON.stringify(relatedPost.heroImage, null, 2).slice(0, 200))
        }

        console.log('  Has Meta Image:', !!relatedPost.meta?.image)
        if (relatedPost.meta?.image) {
          console.log('  Meta Image Type:', typeof relatedPost.meta.image)
          console.log('  Meta Image Value:', JSON.stringify(relatedPost.meta.image, null, 2).slice(0, 200))
        }
      }
    } else {
      console.log('\nNo similar posts found for this post')
    }

    // Also check database directly for a few random posts
    console.log('\n\n=== Checking Random Posts for Hero Images ===')
    const { docs: randomPosts } = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 5,
      depth: 2,
      sort: '-publishedAt'
    })

    for (const post of randomPosts) {
      console.log('\n', post.title)
      console.log('  Has Hero Image:', !!post.heroImage)
      console.log('  Hero Image Type:', post.heroImage ? typeof post.heroImage : 'N/A')
    }

  } catch (error) {
    console.error('Error debugging related posts:', error)
  }
}

run()