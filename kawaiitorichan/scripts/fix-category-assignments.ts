import { getPayload } from 'payload'
import config from '@payload-config'

async function fixCategoryAssignments() {
  console.log('🔧 Starting to fix category assignments...\n')

  const payload = await getPayload({ config })

  // Get all published posts
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      _status: {
        equals: 'published'
      }
    },
    limit: 1000,
    depth: 0,
  })

  console.log(`Found ${posts.length} published posts\n`)

  // Get all categories
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
  })

  console.log(`Found ${categories.length} categories\n`)

  // Create a mapping of category names to IDs for easier lookup
  const categoryMap = new Map<string, number>()
  categories.forEach(cat => {
    categoryMap.set(cat.title, cat.id)
  })

  // Distribution strategy: spread posts across categories
  let updatedCount = 0
  let errorCount = 0

  // Group categories by type
  const birdTypes = categories.filter(c => c.parent === 359) // Children of 鳥の種類
  const careCategories = categories.filter(c => c.parent === 368) // Children of 鳥の飼い方
  const healthCategories = categories.filter(c => c.parent === 369) // Children of 鳥の健康
  const behaviorCategories = categories.filter(c => c.parent === 392) // Children of 鳥の生態
  const observationCategories = categories.filter(c => c.parent === 399) // Children of 野鳥観察
  const nutritionCategories = categories.filter(c => c.parent === 405) // Children of 餌と栄養

  console.log('📊 Category distribution:')
  console.log(`- Bird types: ${birdTypes.length}`)
  console.log(`- Care: ${careCategories.length}`)
  console.log(`- Health: ${healthCategories.length}`)
  console.log(`- Behavior: ${behaviorCategories.length}`)
  console.log(`- Observation: ${observationCategories.length}`)
  console.log(`- Nutrition: ${nutritionCategories.length}\n`)

  // Distribute posts across categories
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const categoryGroups = [
      birdTypes,
      careCategories,
      healthCategories,
      behaviorCategories,
      observationCategories,
      nutritionCategories
    ].filter(group => group.length > 0)

    // Select a category group based on post index
    const groupIndex = i % categoryGroups.length
    const selectedGroup = categoryGroups[groupIndex]

    // Select a specific category within the group
    const categoryIndex = Math.floor(i / categoryGroups.length) % selectedGroup.length
    const selectedCategory = selectedGroup[categoryIndex]

    try {
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          categories: [selectedCategory.id]
        },
      })

      updatedCount++
      if (updatedCount % 50 === 0) {
        console.log(`✅ Updated ${updatedCount}/${posts.length} posts...`)
      }
    } catch (error) {
      errorCount++
      console.error(`❌ Error updating post ${post.id}:`, error.message)
    }
  }

  console.log('\n✅ Category assignment complete!')
  console.log(`Updated: ${updatedCount}`)
  console.log(`Errors: ${errorCount}`)

  // Show final distribution
  console.log('\n📊 Final distribution check:')
  const { docs: updatedCategories } = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  for (const cat of updatedCategories) {
    const { totalDocs } = await payload.find({
      collection: 'posts',
      where: {
        categories: {
          equals: cat.id
        },
        _status: {
          equals: 'published'
        }
      },
      limit: 0,
    })

    if (totalDocs > 0) {
      console.log(`  ${cat.title}: ${totalDocs} posts`)
    }
  }

  process.exit(0)
}

fixCategoryAssignments().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
