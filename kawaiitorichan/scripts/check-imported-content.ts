import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkImportedContent() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Find the most recent imported post
    const posts = await payload.find({
      collection: 'posts',
      where: {
        'contentDbMeta.originalId': { exists: true }
      },
      limit: 1,
      sort: '-createdAt'
    })

    if (posts.docs.length === 0) {
      console.log('No imported posts found')
      process.exit(1)
    }

    const post = posts.docs[0]
    console.log('Found imported post:', {
      id: post.id,
      title: post.title,
      slug: post.slug,
    })

    console.log('\n=== CONTENT STRUCTURE ===')
    console.log(JSON.stringify(post.content, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkImportedContent()