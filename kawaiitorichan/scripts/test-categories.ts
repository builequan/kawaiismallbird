import { getPayload } from 'payload'
import config from '@payload-config'

async function testCategories() {
  const payload = await getPayload({ config })

  console.log('Testing category structure...\n')

  // Get all categories
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'order',
  })

  // Organize into parent-child structure
  const parentCategories = categories.filter(cat => !cat.parent)
  const childCategories = categories.filter(cat => cat.parent)

  console.log(`Total Categories: ${categories.length}`)
  console.log(`Parent Categories: ${parentCategories.length}`)
  console.log(`Child Categories: ${childCategories.length}`)
  console.log('\nCategory Structure:')
  console.log('==================')

  for (const parent of parentCategories) {
    console.log(`\n📁 ${parent.title} (${parent.slug})`)
    if (parent.description) {
      console.log(`   ${parent.description}`)
    }
    
    const children = childCategories.filter(child => {
      const parentId = typeof child.parent === 'object' ? child.parent.id : child.parent
      return parentId === parent.id
    })
    
    for (const child of children) {
      console.log(`   └─ ${child.title} (${child.slug})`)
    }
  }

  // Test category pages will be available at:
  console.log('\n\nCategory Pages (when server is running):')
  console.log('=========================================')
  console.log('📍 All Categories: http://localhost:3000/categories')
  
  for (const category of categories) {
    console.log(`📍 ${category.title}: http://localhost:3000/categories/${category.slug}`)
  }

  // Check for posts with categories
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        exists: true,
      },
    },
    limit: 5,
  })

  console.log(`\n\nPosts with Categories: ${posts.length}`)
  console.log('=========================')
  
  for (const post of posts) {
    console.log(`\n📝 ${post.title}`)
    if (post.categories && Array.isArray(post.categories)) {
      console.log('   Categories:')
      for (const cat of post.categories) {
        if (typeof cat === 'object' && cat.title) {
          console.log(`   - ${cat.title}`)
        }
      }
    }
  }

  process.exit(0)
}

testCategories().catch((error) => {
  console.error('Test error:', error)
  process.exit(1)
})