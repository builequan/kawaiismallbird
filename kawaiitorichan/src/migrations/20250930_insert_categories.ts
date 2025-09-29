import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

const categories = [
  // Main categories (no parent)
  { title: '🦜 鳥の種類', slug: 'bird-species', description: '様々な鳥の種類についての情報', order: 1, parent: null },
  { title: '🏠 鳥の飼い方', slug: 'bird-care', description: '鳥の基本的な飼育方法', order: 2, parent: null },
  { title: '💊 鳥の健康', slug: 'bird-health', description: '鳥の健康管理と病気の対処', order: 3, parent: null },
  { title: '🌿 鳥の生態', slug: 'bird-behavior', description: '鳥の行動と生態について', order: 4, parent: null },
  { title: '🔭 野鳥観察', slug: 'bird-watching', description: '野鳥観察の楽しみ方', order: 5, parent: null },
  { title: '🥗 餌と栄養', slug: 'nutrition-feeding', description: '鳥の餌と栄養管理', order: 6, parent: null },
]

const subCategories = [
  // Bird Species (parent_slug: bird-species)
  { title: 'セキセイインコ', slug: 'budgerigar', description: '明るく社交的なセキセイインコ', order: 1, parent_slug: 'bird-species' },
  { title: 'オカメインコ', slug: 'cockatiel', description: '優しいオカメインコ', order: 2, parent_slug: 'bird-species' },
  { title: 'ラブバード', slug: 'lovebird', description: '愛情深いラブバード', order: 3, parent_slug: 'bird-species' },
  { title: 'ゼブラフィンチ', slug: 'zebra-finch', description: 'ゼブラフィンチ', order: 4, parent_slug: 'bird-species' },
  { title: '文鳥', slug: 'society-finch', description: '文鳥', order: 5, parent_slug: 'bird-species' },
  { title: 'ゴシキキンカン', slug: 'gouldian-finch', description: 'ゴシキキンカン', order: 6, parent_slug: 'bird-species' },
  { title: 'カナリア', slug: 'canary', description: 'カナリア', order: 7, parent_slug: 'bird-species' },
  { title: 'マメルリハ', slug: 'parrotlet', description: 'マメルリハ', order: 8, parent_slug: 'bird-species' },
  { title: 'ジュウシマツ', slug: 'munias', description: 'ジュウシマツ', order: 9, parent_slug: 'bird-species' },

  // Bird Care (parent_slug: bird-care)
  { title: 'ケージと飼育環境', slug: 'housing-enclosures', description: 'ケージの選び方', order: 1, parent_slug: 'bird-care' },
  { title: 'ケージサイズと設置', slug: 'cage-setup', description: 'ケージのサイズ', order: 2, parent_slug: 'bird-care' },
  { title: '止まり木と設備', slug: 'perches-accessories', description: '止まり木', order: 3, parent_slug: 'bird-care' },
  { title: '温度と湿度管理', slug: 'temperature-humidity', description: '温度管理', order: 4, parent_slug: 'bird-care' },
  { title: '照明設備', slug: 'lighting', description: '照明', order: 5, parent_slug: 'bird-care' },
  { title: '清掃と衛生管理', slug: 'cleaning-hygiene', description: '清掃', order: 6, parent_slug: 'bird-care' },

  // Bird Health (parent_slug: bird-health)
  { title: '日常の健康管理', slug: 'daily-health-care', description: '健康チェック', order: 1, parent_slug: 'bird-health' },
  { title: '病気の症状と対処', slug: 'illness-treatment', description: '病気の対処', order: 2, parent_slug: 'bird-health' },
  { title: '応急処置', slug: 'emergency-care', description: '応急処置', order: 3, parent_slug: 'bird-health' },
  { title: '獣医師の診察', slug: 'veterinary-care', description: '獣医師', order: 4, parent_slug: 'bird-health' },
  { title: '換羽期のケア', slug: 'molting-care', description: '換羽期', order: 5, parent_slug: 'bird-health' },
  { title: '繁殖と産卵', slug: 'breeding-care', description: '繁殖', order: 6, parent_slug: 'bird-health' },

  // Bird Behavior (parent_slug: bird-behavior)
  { title: '鳴き声と意思疎通', slug: 'vocalizations', description: '鳴き声', order: 1, parent_slug: 'bird-behavior' },
  { title: '行動パターン', slug: 'behavior-patterns', description: '行動', order: 2, parent_slug: 'bird-behavior' },
  { title: 'しつけと訓練', slug: 'training', description: 'しつけ', order: 3, parent_slug: 'bird-behavior' },
  { title: 'ストレス管理', slug: 'stress-management', description: 'ストレス', order: 4, parent_slug: 'bird-behavior' },
  { title: '社会性と多頭飼い', slug: 'social-behavior', description: '社会性', order: 5, parent_slug: 'bird-behavior' },
  { title: '遊びと運動', slug: 'play-exercise', description: '遊び', order: 6, parent_slug: 'bird-behavior' },

  // Bird Watching (parent_slug: bird-watching)
  { title: '観察の基本', slug: 'observation-basics', description: '観察基本', order: 1, parent_slug: 'bird-watching' },
  { title: '観察場所', slug: 'observation-locations', description: '観察場所', order: 2, parent_slug: 'bird-watching' },
  { title: '観察用具', slug: 'observation-equipment', description: '観察用具', order: 3, parent_slug: 'bird-watching' },
  { title: '季節別観察', slug: 'seasonal-observation', description: '季節別', order: 4, parent_slug: 'bird-watching' },
  { title: '記録と写真', slug: 'recording-photography', description: '記録', order: 5, parent_slug: 'bird-watching' },
  { title: '保護と環境', slug: 'conservation', description: '保護', order: 6, parent_slug: 'bird-watching' },

  // Nutrition (parent_slug: nutrition-feeding)
  { title: '基本的な餌', slug: 'basic-diet', description: '基本的な餌', order: 1, parent_slug: 'nutrition-feeding' },
  { title: '新鮮な野菜と果物', slug: 'fresh-foods', description: '野菜と果物', order: 2, parent_slug: 'nutrition-feeding' },
  { title: 'タンパク質源', slug: 'protein-sources', description: 'タンパク質', order: 3, parent_slug: 'nutrition-feeding' },
  { title: 'サプリメント', slug: 'supplements', description: 'サプリメント', order: 4, parent_slug: 'nutrition-feeding' },
  { title: '危険な食べ物', slug: 'toxic-foods', description: '危険な食べ物', order: 5, parent_slug: 'nutrition-feeding' },
  { title: '給餌スケジュール', slug: 'feeding-schedule', description: '給餌', order: 6, parent_slug: 'nutrition-feeding' },
  { title: '水分補給', slug: 'hydration', description: '水分', order: 7, parent_slug: 'nutrition-feeding' },
  { title: '季節別の栄養', slug: 'seasonal-nutrition', description: '季節別栄養', order: 8, parent_slug: 'nutrition-feeding' },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  payload.logger.info('Starting category seed migration...')

  try {
    // Check if categories already exist
    const existingCategories = await payload.count({
      collection: 'categories',
    })

    if (existingCategories.totalDocs > 0) {
      payload.logger.info(`Categories already exist (${existingCategories.totalDocs} found), skipping seed`)
      return
    }

    // Insert main categories first
    const parentMap = new Map<string, number>()

    for (const cat of categories) {
      try {
        const created = await payload.create({
          collection: 'categories',
          data: {
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            slugLock: true,
          },
        })
        parentMap.set(cat.slug, created.id)
        payload.logger.info(`Created main category: ${cat.title} (ID: ${created.id})`)
      } catch (error) {
        payload.logger.error(`Failed to create category ${cat.title}: ${error}`)
      }
    }

    // Insert subcategories
    for (const cat of subCategories) {
      try {
        const parentId = parentMap.get(cat.parent_slug)
        if (!parentId) {
          payload.logger.error(`Parent not found for ${cat.title}: ${cat.parent_slug}`)
          continue
        }

        const created = await payload.create({
          collection: 'categories',
          data: {
            title: cat.title,
            slug: cat.slug,
            description: cat.description,
            order: cat.order,
            slugLock: true,
            parent: parentId,
          },
        })
        payload.logger.info(`Created subcategory: ${cat.title} (ID: ${created.id}, Parent: ${parentId})`)
      } catch (error) {
        payload.logger.error(`Failed to create subcategory ${cat.title}: ${error}`)
      }
    }

    payload.logger.info('Category seed migration completed successfully')
  } catch (error) {
    payload.logger.error(`Migration failed: ${error}`)
    throw error
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Optionally delete all categories if you want to support rollback
  payload.logger.info('Down migration not implemented for category seed')
}