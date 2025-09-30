import { getPayload } from 'payload'
import config from '@payload-config'

async function fixCitationFormat() {
  console.log('🔧 Starting citation format fix...\n')

  const payload = await getPayload({ config })

  // Find all posts
  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })

  console.log(`📊 Found ${posts.length} posts to check\n`)

  let updatedCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      const contentStr = JSON.stringify(post.content)

      // Check if this post has citations in the old format [[1]](url)
      if (/\[\[\d+\]\]\([^)]+\)/.test(contentStr)) {
        console.log(`📝 Fixing post: ${post.title}`)

        // Recursively fix citations in content
        const fixedContent = fixCitationsInContent(post.content)

        // Update the post through Payload API
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: fixedContent,
          },
        })

        updatedCount++
        console.log(`✅ Updated post ${post.id}\n`)
      }
    } catch (error) {
      console.error(`❌ Error updating post ${post.id}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✨ Citation format fix complete!`)
  console.log(`📊 Updated: ${updatedCount} posts`)
  console.log(`❌ Errors: ${errorCount} posts`)
  console.log('='.repeat(50))

  process.exit(0)
}

function fixCitationsInContent(content: any): any {
  if (!content) return content

  if (typeof content === 'string') {
    // Replace [[1]](url) with [1]
    return content.replace(/\[\[(\d+)\]\]\([^)]+\)/g, '[$1]')
  }

  if (Array.isArray(content)) {
    return content.map(item => fixCitationsInContent(item))
  }

  if (typeof content === 'object') {
    const fixed: any = {}
    for (const key in content) {
      if (key === 'text' && typeof content[key] === 'string') {
        // Fix text content
        fixed[key] = content[key].replace(/\[\[(\d+)\]\]\([^)]+\)/g, '[$1]')
      } else {
        fixed[key] = fixCitationsInContent(content[key])
      }
    }
    return fixed
  }

  return content
}

fixCitationFormat().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})