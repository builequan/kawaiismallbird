import { getPayload } from 'payload'
import config from '@payload-config'

async function setupCategories() {
  const payload = await getPayload({ config })

  // Define the 6 bird categories
  const categoryStructure = [
    {
      title: '鳥の種類',
      slug: 'bird-species',
      description: 'セキセイインコ、オカメインコ、文鳥など、様々な小鳥の種類について',
      order: 1,
      children: [],
    },
    {
      title: '鳥の飼い方',
      slug: 'bird-care',
      description: '小鳥の飼育方法、ケージの選び方、日常のお世話について',
      order: 2,
      children: [],
    },
    {
      title: '鳥の健康',
      slug: 'bird-health',
      description: '小鳥の健康管理、病気の予防と対処法について',
      order: 3,
      children: [],
    },
    {
      title: '鳥の生態',
      slug: 'bird-ecology',
      description: '小鳥の習性、行動、生態について学ぼう',
      order: 4,
      children: [],
    },
    {
      title: '餌と栄養',
      slug: 'food-nutrition',
      description: '小鳥の食事、栄養管理、おやつについて',
      order: 5,
      children: [],
    },
    {
      title: '野鳥観察',
      slug: 'wild-bird-watching',
      description: '野鳥の観察方法、識別、バードウォッチングのコツ',
      order: 6,
      children: [],
    },
  ]

  console.log('Setting up bird categories...')

  try {
    // First, create all parent categories
    const parentCategories = new Map()

    for (const parentCategory of categoryStructure) {
      // Check if category already exists
      const existing = await payload.find({
        collection: 'categories',
        where: {
          slug: {
            equals: parentCategory.slug,
          },
        },
        limit: 1,
      })

      let parent
      if (existing.docs.length > 0) {
        parent = existing.docs[0]
        console.log(`Parent category "${parentCategory.title}" already exists`)
      } else {
        parent = await payload.create({
          collection: 'categories',
          data: {
            title: parentCategory.title,
            slug: parentCategory.slug,
            description: parentCategory.description,
            order: parentCategory.order,
          },
        })
        console.log(`Created parent category: ${parentCategory.title}`)
      }

      parentCategories.set(parentCategory.slug, parent)

      // Create child categories
      for (const childCategory of parentCategory.children) {
        const existingChild = await payload.find({
          collection: 'categories',
          where: {
            slug: {
              equals: childCategory.slug,
            },
          },
          limit: 1,
        })

        if (existingChild.docs.length > 0) {
          console.log(`  - Child category "${childCategory.title}" already exists`)
        } else {
          await payload.create({
            collection: 'categories',
            data: {
              title: childCategory.title,
              slug: childCategory.slug,
              description: childCategory.description,
              parent: parent.id,
              order: 0,
            },
          })
          console.log(`  - Created child category: ${childCategory.title}`)
        }
      }
    }

    console.log('\n✅ Category setup completed successfully!')
    console.log('\nCategory structure:')
    for (const category of categoryStructure) {
      console.log(`\n${category.title}`)
      for (const child of category.children) {
        console.log(`  - ${child.title}`)
      }
    }

  } catch (error) {
    console.error('Error setting up categories:', error)
    process.exit(1)
  }

  process.exit(0)
}

setupCategories()