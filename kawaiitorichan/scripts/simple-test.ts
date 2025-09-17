import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function simpleTest() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('Creating simple test post...')
  
  // Find or create categories
  let category1 = await payload.find({
    collection: 'categories',
    where: { title: { equals: 'Golf Basics' } }
  })
  
  if (category1.docs.length === 0) {
    category1 = await payload.create({
      collection: 'categories',
      data: {
        title: 'Golf Basics',
        slug: 'golf-basics'
      }
    })
  }
  
  // Create simple post
  const post = await payload.create({
    collection: 'posts',
    data: {
      title: 'Test Golf Terminology Post',
      slug: 'test-golf-terminology',
      categories: [category1.docs.length > 0 ? category1.docs[0].id : category1.id],
      content: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'This is a test post to verify categories are working.',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      _status: 'published',
      language: 'en',
    }
  })
  
  console.log('Post created:', post.id)
  console.log('Categories assigned:', post.categories)
  
  // Verify the post
  const verifyPost = await payload.findByID({
    collection: 'posts',
    id: post.id,
    depth: 2
  })
  
  console.log('\n=== Verification ===')
  console.log('Title:', verifyPost.title)
  console.log('Categories:')
  if (verifyPost.categories && verifyPost.categories.length > 0) {
    verifyPost.categories.forEach((cat: any) => {
      if (typeof cat === 'object') {
        console.log(`  - ${cat.title} (${cat.slug})`)
      } else {
        console.log(`  - Category ID: ${cat}`)
      }
    })
  } else {
    console.log('  No categories assigned')
  }
  
  console.log(`\nView in admin: http://localhost:3000/admin/collections/posts/${post.id}`)
  
  process.exit(0)
}

simpleTest().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})