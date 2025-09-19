import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkPostImages() {
  const payload = await getPayload({ config: configPromise })

  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 10,
    depth: 2,
    sort: '-publishedAt'
  })

  console.log(`Found ${posts.length} posts`)

  posts.forEach(post => {
    console.log(`\nPost: ${post.title}`)
    console.log(`ID: ${post.id}`)
    console.log(`Hero Image:`, post.heroImage ? 'YES' : 'NO')
    if (post.heroImage && typeof post.heroImage === 'object') {
      console.log(`  - URL: ${post.heroImage.url}`)
      console.log(`  - Alt: ${post.heroImage.alt || 'No alt text'}`)
      console.log(`  - Width: ${post.heroImage.width}`)
      console.log(`  - Height: ${post.heroImage.height}`)
    }
    console.log(`Meta Image:`, post.meta?.image ? 'YES' : 'NO')
    if (post.meta?.image && typeof post.meta.image === 'object') {
      console.log(`  - Meta URL: ${post.meta.image.url}`)
    }
    console.log(`Categories:`, post.categories?.length || 0)
  })
}

checkPostImages().catch(console.error)