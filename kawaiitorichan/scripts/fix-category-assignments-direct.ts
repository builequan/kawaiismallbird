import postgres from 'postgres'

const DATABASE_URI = process.env.DATABASE_URI || 'postgres://postgres:2801@127.0.0.1:5432/golfer'

async function fixCategoryAssignmentsDirect() {
  console.log('🔧 Starting to fix category assignments (direct SQL)...\n')

  const sql = postgres(DATABASE_URI)

  try {
    // Get all posts
    const posts = await sql`
      SELECT id, title FROM posts WHERE _status = 'published' ORDER BY id
    `
    console.log(`Found ${posts.length} published posts\n`)

    // Get all categories with parent info
    const categories = await sql`
      SELECT id, title, parent_id FROM categories ORDER BY id
    `
    console.log(`Found ${categories.length} categories\n`)

    // Group categories by parent
    const birdTypes = categories.filter(c => c.parent_id === 359) // Children of 鳥の種類
    const careCategories = categories.filter(c => c.parent_id === 368) // Children of 鳥の飼い方
    const healthCategories = categories.filter(c => c.parent_id === 369) // Children of 鳥の健康
    const behaviorCategories = categories.filter(c => c.parent_id === 392) // Children of 鳥の生態
    const observationCategories = categories.filter(c => c.parent_id === 399) // Children of 野鳥観察
    const nutritionCategories = categories.filter(c => c.parent_id === 405) // Children of 餌と栄養

    console.log('📊 Category distribution:')
    console.log(`- Bird types (鳥の種類): ${birdTypes.length}`)
    console.log(`- Care (鳥の飼い方): ${careCategories.length}`)
    console.log(`- Health (鳥の健康): ${healthCategories.length}`)
    console.log(`- Behavior (鳥の生態): ${behaviorCategories.length}`)
    console.log(`- Observation (野鳥観察): ${observationCategories.length}`)
    console.log(`- Nutrition (餌と栄養): ${nutritionCategories.length}\n`)

    const categoryGroups = [
      birdTypes,
      careCategories,
      healthCategories,
      behaviorCategories,
      observationCategories,
      nutritionCategories
    ].filter(group => group.length > 0)

    console.log('Clearing existing category relationships...')
    await sql`DELETE FROM posts_rels WHERE categories_id IS NOT NULL`
    console.log('✅ Cleared\n')

    console.log('Assigning posts to categories...')
    let assignedCount = 0

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]

      // Select a category group based on post index
      const groupIndex = i % categoryGroups.length
      const selectedGroup = categoryGroups[groupIndex]

      // Select a specific category within the group
      const categoryIndex = Math.floor(i / categoryGroups.length) % selectedGroup.length
      const selectedCategory = selectedGroup[categoryIndex]

      // Insert the relationship
      await sql`
        INSERT INTO posts_rels (posts_id, categories_id, "order", parent_id, path)
        VALUES (${post.id}, ${selectedCategory.id}, 0, ${post.id}, 'categories')
      `

      assignedCount++
      if (assignedCount % 50 === 0) {
        console.log(`✅ Assigned ${assignedCount}/${posts.length} posts...`)
      }
    }

    console.log(`\n✅ Successfully assigned all ${assignedCount} posts to categories!\n`)

    // Show final distribution
    console.log('📊 Final distribution check:')
    const distribution = await sql`
      SELECT
        c.id,
        c.title,
        c.parent_id,
        COUNT(pr.posts_id) as post_count
      FROM categories c
      LEFT JOIN posts_rels pr ON c.id = pr.categories_id
      GROUP BY c.id, c.title, c.parent_id
      HAVING COUNT(pr.posts_id) > 0
      ORDER BY post_count DESC, c.id
    `

    for (const cat of distribution) {
      const parentInfo = cat.parent_id ? ` (child of ${cat.parent_id})` : ' (parent)'
      console.log(`  ${cat.title}: ${cat.post_count} posts${parentInfo}`)
    }

    console.log('\n✅ Category assignment complete!')

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

fixCategoryAssignmentsDirect()
