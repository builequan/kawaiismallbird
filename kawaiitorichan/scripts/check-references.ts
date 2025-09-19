import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkPostContent() {
  const payload = await getPayload({ config: configPromise })

  // Get a post to check its content structure
  const posts = await payload.find({
    collection: 'posts',
    limit: 10
  })

  console.log('Found', posts.docs.length, 'posts')

  for (const post of posts.docs) {
    if (!post.content || !post.content.root) continue

    // Look for reference sections
    for (const child of post.content.root.children || []) {
      if (child.type === 'heading') {
        const text = extractText(child)
        if (text && (text.includes('参考文献') || text.includes('出典'))) {
          console.log('\nPost:', post.title)
          console.log('Has references heading:', text)
          console.log('Post ID:', post.id)

          // Check what comes after
          const idx = post.content.root.children.indexOf(child)
          if (idx < post.content.root.children.length - 1) {
            const next = post.content.root.children[idx + 1]
            console.log('Next node type:', next.type)
            if (next.type === 'list') {
              console.log('List items:', next.children?.length || 0)
            }
          }
          break
        }
      }
    }
  }

  function extractText(node: any): string {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (node.children) return node.children.map(extractText).join('')
    return ''
  }

  process.exit(0)
}

checkPostContent()