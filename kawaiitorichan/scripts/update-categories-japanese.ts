import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function updateCategories() {
  const payload = await getPayload({ config: configPromise })

  // New category structure based on CSV file
  const categories = [
    {
      title: '鳥の種類',
      slug: 'bird-species',
      description: '様々な小鳥の種類とそれぞれの特徴について',
      children: [
        { title: 'セキセイインコ', slug: 'budgerigar', description: 'セキセイインコの飼育について' },
        { title: 'オカメインコ', slug: 'cockatiel', description: 'オカメインコの飼育について' },
        { title: 'ラブバード', slug: 'lovebird', description: 'ラブバードの飼育について' },
        { title: 'ゼブラフィンチ', slug: 'zebra-finch', description: 'ゼブラフィンチの飼育について' },
        { title: '文鳥', slug: 'society-finch', description: '文鳥の飼育について' },
        { title: 'ゴシキキンカン', slug: 'gouldian-finch', description: 'ゴシキキンカンの飼育について' },
        { title: 'カナリア', slug: 'canary', description: 'カナリアの飼育について' },
        { title: 'マメルリハ', slug: 'parrotlet', description: 'マメルリハの飼育について' },
        { title: 'ジュウシマツ', slug: 'munias', description: 'ジュウシマツの飼育について' }
      ]
    },
    {
      title: '鳥の飼い方',
      slug: 'bird-care',
      description: '鳥の基本的な飼育方法と日常ケア',
      children: [
        { title: 'ケージと飼育環境', slug: 'housing-enclosures', description: 'ケージの選び方と飼育環境の整備' },
        { title: 'ケージサイズと設置', slug: 'cage-setup', description: '適切なケージサイズと設置方法' },
        { title: '止まり木と設備', slug: 'perches-accessories', description: '止まり木とケージ内設備について' },
        { title: '温度と湿度管理', slug: 'temperature-humidity', description: '適切な温度と湿度の管理方法' },
        { title: '照明設備', slug: 'lighting', description: 'UVB照明と自然光の活用' },
        { title: '清掃と衛生管理', slug: 'cleaning-hygiene', description: 'ケージの清掃と衛生管理' }
      ]
    },
    {
      title: '鳥の健康',
      slug: 'bird-health',
      description: '鳥の健康管理と病気の予防・治療',
      children: [
        { title: '日常の健康管理', slug: 'daily-health-care', description: '毎日の健康チェックと予防ケア' },
        { title: '病気の症状と対処', slug: 'illness-treatment', description: '一般的な病気の症状と治療法' },
        { title: '応急処置', slug: 'emergency-care', description: '緊急時の応急処置方法' },
        { title: '獣医師の診察', slug: 'veterinary-care', description: '獣医師への相談と診察について' },
        { title: '換羽期のケア', slug: 'molting-care', description: '換羽期の特別なケア方法' },
        { title: '繁殖と産卵', slug: 'breeding-care', description: '繁殖時期と産卵のケア' }
      ]
    },
    {
      title: '鳥の生態',
      slug: 'bird-behavior',
      description: '鳥の行動と習性について',
      children: [
        { title: '鳴き声と意思疎通', slug: 'vocalizations', description: '鳴き声の意味と鳥との意思疎通' },
        { title: '行動パターン', slug: 'behavior-patterns', description: '日常的な行動パターンと習性' },
        { title: 'しつけと訓練', slug: 'training', description: '基本的なしつけと訓練方法' },
        { title: 'ストレス管理', slug: 'stress-management', description: 'ストレスの原因と対処法' },
        { title: '社会性と多頭飼い', slug: 'social-behavior', description: '鳥の社会性と複数飼育について' },
        { title: '遊びと運動', slug: 'play-exercise', description: '適切な遊びと運動の提供' }
      ]
    },
    {
      title: '野鳥観察',
      slug: 'bird-watching',
      description: '野鳥観察の方法と楽しみ方',
      children: [
        { title: '観察の基本', slug: 'observation-basics', description: '野鳥観察の基本的な方法' },
        { title: '観察場所', slug: 'observation-locations', description: '野鳥観察に適した場所' },
        { title: '観察用具', slug: 'observation-equipment', description: '双眼鏡やカメラなどの観察用具' },
        { title: '季節別観察', slug: 'seasonal-observation', description: '季節ごとの野鳥観察ポイント' },
        { title: '記録と写真', slug: 'recording-photography', description: '観察記録と写真撮影のコツ' },
        { title: '保護と環境', slug: 'conservation', description: '野鳥保護と環境保全について' }
      ]
    },
    {
      title: '餌と栄養',
      slug: 'nutrition-feeding',
      description: '鳥の栄養管理と適切な餌について',
      children: [
        { title: '基本的な餌', slug: 'basic-diet', description: '種子とペレットの基本的な餌' },
        { title: '新鮮な野菜と果物', slug: 'fresh-foods', description: '安全な野菜と果物の与え方' },
        { title: 'タンパク質源', slug: 'protein-sources', description: '卵や昆虫などのタンパク質源' },
        { title: 'サプリメント', slug: 'supplements', description: 'ビタミンやミネラルの補給' },
        { title: '危険な食べ物', slug: 'toxic-foods', description: '鳥に有害な食べ物の回避' },
        { title: '給餌スケジュール', slug: 'feeding-schedule', description: '適切な給餌の回数と時間' },
        { title: '水分補給', slug: 'hydration', description: '適切な水分補給の方法' },
        { title: '季節別の栄養', slug: 'seasonal-nutrition', description: '季節に応じた栄養管理' }
      ]
    }
  ]

  try {
    console.log('Starting category update...')

    // First, get existing categories to avoid duplicates
    const { docs: existingCategories } = await payload.find({
      collection: 'categories',
      limit: 1000
    })

    console.log(`Found ${existingCategories.length} existing categories`)

    // Create or update main categories
    for (const category of categories) {
      console.log(`\nProcessing main category: ${category.title}`)

      // Check if main category exists
      let mainCategory = existingCategories.find(cat => cat.slug === category.slug)

      if (mainCategory) {
        console.log(`Updating existing main category: ${category.title}`)
        mainCategory = await payload.update({
          collection: 'categories',
          id: mainCategory.id,
          data: {
            title: category.title,
            description: category.description
          }
        })
      } else {
        console.log(`Creating new main category: ${category.title}`)
        mainCategory = await payload.create({
          collection: 'categories',
          data: {
            title: category.title,
            slug: category.slug,
            description: category.description
          }
        })
      }

      // Create or update subcategories
      for (const child of category.children) {
        console.log(`  Processing subcategory: ${child.title}`)

        let childCategory = existingCategories.find(cat => cat.slug === child.slug)

        if (childCategory) {
          console.log(`  Updating existing subcategory: ${child.title}`)
          await payload.update({
            collection: 'categories',
            id: childCategory.id,
            data: {
              title: child.title,
              description: child.description,
              parent: mainCategory.id
            }
          })
        } else {
          console.log(`  Creating new subcategory: ${child.title}`)
          await payload.create({
            collection: 'categories',
            data: {
              title: child.title,
              slug: child.slug,
              description: child.description,
              parent: mainCategory.id
            }
          })
        }
      }
    }

    console.log('\n✅ Category update completed successfully!')

    // Show final count
    const { docs: finalCategories } = await payload.find({
      collection: 'categories',
      limit: 1000
    })

    console.log(`Total categories after update: ${finalCategories.length}`)

  } catch (error) {
    console.error('❌ Error updating categories:', error)
  }
}

updateCategories().catch(console.error)