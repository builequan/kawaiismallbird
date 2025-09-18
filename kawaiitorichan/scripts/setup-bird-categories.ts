import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function setupBirdCategories() {
  try {
    const payload = await getPayload({ config: configPromise })

    const categories = [
      {
        title: '野鳥観察',
        slug: 'wild-birds',
        description: '日本の野鳥の観察記録と写真',
        color: 'green',
      },
      {
        title: '飼い鳥',
        slug: 'pet-birds',
        description: 'インコ、文鳥、カナリアなどの飼い鳥について',
        color: 'blue',
      },
      {
        title: '鳥の写真',
        slug: 'bird-photos',
        description: '美しい鳥たちの写真ギャラリー',
        color: 'purple',
      },
      {
        title: '鳥の生態',
        slug: 'bird-ecology',
        description: '鳥たちの習性と生態について',
        color: 'orange',
      },
      {
        title: '鳥の飼い方',
        slug: 'bird-care',
        description: '小鳥の飼育方法とお世話のコツ',
        color: 'pink',
      },
      {
        title: '鳥の種類',
        slug: 'bird-species',
        description: '様々な鳥の種類と特徴',
        color: 'cyan',
      },
      {
        title: '鳥の健康',
        slug: 'bird-health',
        description: '鳥の健康管理と病気の予防',
        color: 'red',
      },
      {
        title: '鳥のグッズ',
        slug: 'bird-goods',
        description: '鳥用品とおすすめアイテム',
        color: 'yellow',
      },
    ]

    console.log('🦜 Setting up bird categories...')

    for (const categoryData of categories) {
      // Check if category already exists
      const existing = await payload.find({
        collection: 'categories',
        where: {
          slug: {
            equals: categoryData.slug,
          },
        },
      })

      if (existing.docs.length === 0) {
        // Create new category
        await payload.create({
          collection: 'categories',
          data: {
            ...categoryData,
            _status: 'published',
          },
        })
        console.log(`✅ Created category: ${categoryData.title}`)
      } else {
        // Update existing category
        await payload.update({
          collection: 'categories',
          id: existing.docs[0].id,
          data: {
            ...categoryData,
            _status: 'published',
          },
        })
        console.log(`📝 Updated category: ${categoryData.title}`)
      }
    }

    console.log('🎉 All bird categories have been set up successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to setup categories:', error)
    process.exit(1)
  }
}

setupBirdCategories()