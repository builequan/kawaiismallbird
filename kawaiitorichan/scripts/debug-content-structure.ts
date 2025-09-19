import { getPayload } from 'payload'
import config from '../src/payload.config'

const run = async () => {
  try {
    const payload = await getPayload({ config })

    // Get a post that we know has images in content
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 3,
      depth: 2
    })

    for (const post of posts) {
      console.log(`\n=== ${post.title} ===`)

      // Check content structure
      if (post.content && post.content.root) {
        console.log('Content has root structure')

        // Traverse the content to find upload nodes
        const findUploadNodes = (node: any, path: string = 'root'): void => {
          if (!node) return

          if (node.type === 'upload') {
            console.log(`Found upload node at ${path}:`)
            console.log(`  relationTo: ${node.relationTo}`)
            console.log(`  value: ${JSON.stringify(node.value)}`)

            // Check if value is an object or number
            if (typeof node.value === 'object' && node.value?.id) {
              console.log(`  Media ID (from object): ${node.value.id}`)
            } else if (typeof node.value === 'number') {
              console.log(`  Media ID (direct): ${node.value}`)
            }
          }

          // Check children
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any, index: number) => {
              findUploadNodes(child, `${path}.children[${index}]`)
            })
          }
        }

        findUploadNodes(post.content.root)
      }

      // Also check raw JSON to see structure
      const contentStr = JSON.stringify(post.content).slice(0, 1000)
      console.log('\nFirst 1000 chars of content JSON:')
      console.log(contentStr)
    }

  } catch (error) {
    console.error('Error debugging content:', error)
  }
}

run()