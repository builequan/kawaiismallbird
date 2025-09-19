import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testLexicalDirect() {
  const payload = await getPayload({ config: configPromise })

  try {
    // First, check what media we have
    const media = await payload.find({
      collection: 'media',
      limit: 1,
    })

    if (media.docs.length === 0) {
      console.log('No media found. Please upload an image first.')
      process.exit(1)
    }

    const mediaItem = media.docs[0]
    console.log('Using media:', {
      id: mediaItem.id,
      filename: mediaItem.filename,
      alt: mediaItem.alt,
    })

    // Create a test post with proper upload node structure
    const testContent = {
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'heading',
            version: 1,
            tag: 'h1',
            children: [
              {
                type: 'text',
                version: 1,
                text: 'Test Post with Image'
              }
            ]
          },
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'This is a paragraph before the image.'
              }
            ]
          },
          {
            type: 'upload',
            version: 1,
            relationTo: 'media',
            value: mediaItem.id, // Just the ID, not an object
          },
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: 'This is a paragraph after the image.'
              }
            ]
          }
        ]
      }
    }

    console.log('\nCreating test post with structure:')
    console.log(JSON.stringify(testContent, null, 2))

    // Create the post
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Post with Embedded Image',
        content: testContent,
        slug: 'test-post-with-image',
        language: 'en',
        _status: 'published',
        publishedAt: new Date().toISOString(),
        meta: {
          title: 'Test Post',
          description: 'Testing image embedding',
        },
      },
    })

    console.log('\n✅ Post created successfully!')
    console.log('Post ID:', post.id)
    console.log('View at: http://localhost:3000/posts/' + post.slug)

  } catch (error) {
    console.error('Error:', error)
    if (error?.data) {
      console.error('Validation errors:', JSON.stringify(error.data, null, 2))
    }
  }

  process.exit(0)
}

testLexicalDirect().catch(console.error)
