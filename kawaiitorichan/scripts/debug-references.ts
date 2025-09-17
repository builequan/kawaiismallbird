import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugReferences() {
  const payload = await getPayload({ config: configPromise })

  // Get the specific post
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: 'key-elements-of-golf-course-architecture-every-new-player-should-know-ja'
      }
    },
    depth: 2,
  })

  if (posts.docs.length === 0) {
    console.log('Post not found')
    return
  }

  const post = posts.docs[0]
  console.log(`\nAnalyzing post: ${post.title}`)
  console.log('=' .repeat(60))

  if (!post.content || !post.content.root || !post.content.root.children) {
    console.log('No content found')
    return
  }

  // Look for headings and their content
  post.content.root.children.forEach((child: any, index: number) => {
    if (child.type === 'heading') {
      const text = extractText(child)
      console.log(`\n[${index}] HEADING (${child.tag || 'h2'}): "${text}"`)

      // Check if it contains reference keywords
      if (text && (text.includes('出典') || text.includes('参考'))) {
        console.log('  >>> This is a REFERENCE heading!')
        console.log('  >>> Full node:', JSON.stringify(child, null, 2))
      }
    } else if (child.type === 'list') {
      const firstItem = child.children?.[0]
      const firstItemText = firstItem ? extractText(firstItem).substring(0, 100) : ''
      console.log(`[${index}] LIST (${child.listType}): First item: "${firstItemText}..."`)
    } else if (child.type === 'paragraph') {
      const text = extractText(child).substring(0, 100)
      console.log(`[${index}] PARAGRAPH: "${text}..."`)
    } else {
      console.log(`[${index}] ${child.type.toUpperCase()}`)
    }
  })
}

function extractText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

debugReferences()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })