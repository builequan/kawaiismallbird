import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkPostReferences() {
  const payload = await getPayload({ config: configPromise })

  // Search for posts that might contain references
  const posts = await payload.find({
    collection: 'posts',
    limit: 10,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  console.log(`Checking ${posts.docs.length} posts for references...`)

  for (const post of posts.docs) {
    let hasReferences = false
    const references: string[] = []

    // Check content for reference patterns
    function traverseNode(node: any) {
      if (!node) return

      if (node.type === 'text' && node.text) {
        // Check for reference keywords
        if (node.text.includes('出典') || node.text.includes('参考文献') || node.text.includes('http')) {
          hasReferences = true
          if (node.text.includes('http')) {
            const urlMatch = node.text.match(/https?:\/\/[^\s<]+/)
            if (urlMatch) {
              references.push(urlMatch[0])
            }
          }
        }
      }

      if (node.type === 'listitem' && node.children) {
        const text = extractText(node)
        if (text && (text.includes('http') || /^\d+[\.\)]/.test(text))) {
          references.push(text)
        }
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverseNode)
      }
    }

    function extractText(node: any): string {
      if (!node) return ''
      if (node.type === 'text') return node.text || ''
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractText).join('')
      }
      return ''
    }

    if (post.content && post.content.root) {
      traverseNode(post.content.root)
    }

    if (hasReferences || references.length > 0) {
      console.log(`\n📄 Post: ${post.title}`)
      console.log(`   Slug: ${post.slug}`)
      console.log(`   Has references: ${hasReferences}`)
      console.log(`   Found ${references.length} reference items:`)
      references.forEach((ref, i) => {
        console.log(`     ${i + 1}. ${ref.substring(0, 100)}${ref.length > 100 ? '...' : ''}`)
      })
      console.log(`   View at: http://localhost:3000/posts/${post.slug}`)
    }
  }
}

checkPostReferences()
  .then(() => {
    console.log('\nDone checking posts!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })