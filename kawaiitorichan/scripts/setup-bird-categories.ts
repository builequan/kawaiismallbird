import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function setupBirdCategories() {
  const payload = await getPayload({ config: configPromise })

  const categories = [
    {
      title: '鳥の種類',
      slug: 'bird-species',
      description: '世界中のかわいい小鳥たちの種類と特徴',
      order: 1,
    },
    {
      title: '観察用具',
      slug: 'birdwatching-gear',
      description: 'バードウォッチングに必要な道具と使い方',
      order: 2,
    },
    {
      title: '撮影技術',
      slug: 'photography',
      description: '野鳥撮影のテクニックとコツ',
      order: 3,
    },
    {
      title: '生息地',
      slug: 'habitats',
      description: '鳥たちが暮らす様々な環境',
      order: 4,
    },
    {
      title: '保護活動',
      slug: 'conservation',
      description: '野鳥保護と環境保全の取り組み',
      order: 5,
    },
  ]

  try {
    // Delete existing golf categories if any
    const existingCategories = await payload.find({
      collection: 'categories',
      limit: 100,
    })

    for (const category of existingCategories.docs) {
      await payload.delete({
        collection: 'categories',
        id: category.id,
      })
    }
    console.log('✅ Cleared existing categories')

    // Create new bird categories
    for (const categoryData of categories) {
      await payload.create({
        collection: 'categories',
        data: categoryData,
      })
      console.log(`✅ Created category: ${categoryData.title}`)
    }

    console.log('🎉 All bird categories set up successfully!')
  } catch (error) {
    console.error('❌ Error setting up categories:', error)
  }

  process.exit(0)
}

setupBirdCategories()