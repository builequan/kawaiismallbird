import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

async function checkCategoryPosts() {
  const payload = await getPayload({ config })

  // Get all categories with post counts
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0
  })

  console.log('Parent categories with children:\n')

  // Get only parent categories
  const parentCats = categories.filter(cat => !cat.parent)

  for (const cat of parentCats) {
    const { docs: children } = await payload.find({
      collection: 'categories',
      where: {
        parent: { equals: cat.id }
      }
    })

    // Count posts in children
    let totalChildPosts = 0
    for (const child of children) {
      const { totalDocs } = await payload.find({
        collection: 'posts',
        limit: 1,
        where: {
          categories: { equals: child.id }
        }
      })
      totalChildPosts += totalDocs
    }

    console.log(`${cat.title} (ID: ${cat.id}) - ${children.length} children, ${totalChildPosts} total posts`)
    if (totalChildPosts === 0) {
      console.log(`  ⚠️  SHOULD BE HIDDEN - NO POSTS`)
    }
  }

  process.exit(0)
}

checkCategoryPosts()
