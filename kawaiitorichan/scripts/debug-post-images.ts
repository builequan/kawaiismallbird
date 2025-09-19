import { getPayload } from 'payload'
import config from '../src/payload.config'

async function debugPostImages() {
  const payload = await getPayload({ config })

  // Get the bird-care category
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: 'bird-care',
      },
    },
    limit: 1,
  })

  const category = categories[0]
  if (!category) {
    console.log('No bird-care category found')
    return
  }

  // Get posts in bird-care category
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        contains: category.id,
      },
      _status: {
        equals: 'published',
      },
    },
    limit: 5,
    depth: 3,
  })

  console.log(`Found ${posts.length} posts in bird-care category\n`)

  for (const post of posts) {
    console.log(`\n=== Post: ${post.title} ===`)
    console.log(`Slug: ${post.slug}`)

    // Check hero field
    if (post.hero) {
      console.log('Hero field:', JSON.stringify(post.hero, null, 2))
    } else {
      console.log('No hero field')
    }

    // Check content structure
    if (post.content && typeof post.content === 'object' && post.content.root) {
      console.log('\nContent structure:')

      // Find all upload nodes
      const findUploads = (node: any, path = ''): void => {
        if (node.type === 'upload') {
          console.log(`  Upload node at ${path}:`)
          console.log(`    value type: ${typeof node.value}`)
          if (typeof node.value === 'object') {
            console.log(`    value keys: ${Object.keys(node.value).join(', ')}`)
            if (node.value.url) {
              console.log(`    URL: ${node.value.url}`)
            }
            if (node.value.filename) {
              console.log(`    Filename: ${node.value.filename}`)
            }
          } else {
            console.log(`    value: ${node.value}`)
          }
        }

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any, index: number) => {
            findUploads(child, `${path}/children[${index}]`)
          })
        }
      }

      findUploads(post.content.root, 'root')
    } else {
      console.log('No content or unexpected content structure')
    }
  }

  process.exit(0)
}

debugPostImages().catch(console.error)