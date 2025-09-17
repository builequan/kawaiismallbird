import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  const posts = await payload.find({
    collection: 'posts',
    limit: 1,
    depth: 0
  })
  
  if (posts.docs.length > 0) {
    const post = posts.docs[0]
    console.log('Post title:', post.title)
    console.log('\nPost fields:')
    Object.keys(post).forEach(key => {
      const value = post[key]
      const type = typeof value
      const length = type === 'object' && value ? JSON.stringify(value).length : 0
      console.log(`  ${key}: ${type}${length > 0 ? ` (${length} chars)` : ''}`)
    })
    
    // Check content specifically
    if (post.content_html) {
      console.log('\ncontent_html structure:')
      console.log(JSON.stringify(post.content_html, null, 2).substring(0, 500))
    }
  }
  
  await payload.db.destroy()
}

main().catch(console.error)