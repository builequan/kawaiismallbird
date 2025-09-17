import { getPayload } from 'payload'
import config from '@payload-config'

async function setupCategoriesJapanese() {
  const payload = await getPayload({ config })

  // Define the 5 parent categories with Japanese translations
  const categoryStructure = [
    {
      title: '基礎・入門',
      slug: 'fundamentals',
      description: 'ゴルフの基本知識と初心者向けの基礎概念',
      order: 1,
      children: [
        { title: 'はじめてのゴルフ', slug: 'getting-started', description: 'ゴルフを始めるために必要なすべて' },
        { title: '基本テクニック', slug: 'basic-techniques', description: 'ゴルフの基本的な技術とフォーム' },
        { title: 'ゴルフの基礎', slug: 'golf-basics', description: 'ゲームの核心概念と基本' },
        { title: '用語・概念', slug: 'terminology-concepts', description: 'ゴルフ用語と重要な概念' },
      ],
    },
    {
      title: '用具・ギア',
      slug: 'equipment',
      description: 'ゴルフクラブ、ボール、アクセサリー、ギアガイド',
      order: 2,
      children: [
        { title: 'クラブ', slug: 'clubs', description: 'ゴルフクラブの選択、レビュー、ガイド' },
        { title: 'ボール・アクセサリー', slug: 'balls-accessories', description: 'ゴルフボール、ティー、必須アクセサリー' },
        { title: 'ギアレビュー', slug: 'gear-reviews', description: 'ゴルフ用具の詳細レビュー' },
        { title: '用具ガイド', slug: 'equipment-guides', description: '包括的な用具購入とメンテナンスガイド' },
        { title: 'テクノロジー・革新', slug: 'technology-innovation', description: '最新のゴルフテクノロジーとイノベーション' },
      ],
    },
    {
      title: 'スキル・技術',
      slug: 'skills-technique',
      description: 'ゴルフスキルの向上と技術の完璧化',
      order: 3,
      children: [
        { title: 'スイングメカニクス', slug: 'swing-mechanics', description: 'ゴルフスイングの基本をマスター' },
        { title: 'ショートゲーム', slug: 'short-game', description: 'チッピング、ピッチング、グリーンサイドスキル' },
        { title: 'パッティング', slug: 'putting', description: 'パッティング技術と戦略' },
        { title: '練習・ドリル', slug: 'practice-drills', description: '効果的な練習ルーティンとドリル' },
        { title: '問題解決', slug: 'problem-solving', description: '一般的なゴルフの問題と間違いを修正' },
        { title: '上級テクニック', slug: 'advanced-techniques', description: '経験者向けの高度なスキル' },
      ],
    },
    {
      title: 'プレー・戦略',
      slug: 'playing-golf',
      description: 'コース管理、戦略、プレー条件',
      order: 4,
      children: [
        { title: 'コース管理', slug: 'course-management', description: 'ゴルフコースを効果的にナビゲート' },
        { title: '戦略・戦術', slug: 'strategy-tactics', description: 'スマートなゴルフ戦略と戦術的判断' },
        { title: 'メンタルゲーム', slug: 'mental-game', description: 'ゴルフ心理学とメンタル準備' },
        { title: 'スコアリング・改善', slug: 'scoring-improvement', description: '進捗を追跡しスコアを改善' },
        { title: '天候・コンディション', slug: 'weather-conditions', description: '様々な天候とコースコンディションでのプレー' },
        { title: '競技フォーマット', slug: 'different-formats', description: '様々なゴルフゲームフォーマットとバリエーション' },
      ],
    },
    {
      title: 'ゴルフライフ',
      slug: 'golf-life',
      description: 'ゴルフ文化、エチケット、ルール、ライフスタイル',
      order: 5,
      children: [
        { title: 'ルール・規則', slug: 'rules-regulations', description: '公式ゴルフルールと規則' },
        { title: 'エチケット・文化', slug: 'etiquette-culture', description: 'ゴルフエチケットと文化的側面' },
        { title: 'ゴルフライフスタイル', slug: 'golf-lifestyle', description: 'ゴルフライフスタイルを生きる' },
        { title: '競技・イベント', slug: 'competitions-events', description: 'トーナメント、競技、ゴルフイベント' },
        { title: 'ゴルフビジネス', slug: 'golf-business', description: 'ゴルフビジネスと業界の洞察' },
        { title: '歴史・伝統', slug: 'history-traditions', description: 'ゴルフの歴史と伝統' },
      ],
    },
  ]

  console.log('日本語カテゴリーの設定を開始...')

  try {
    // First, clear existing categories if needed
    const existingCategories = await payload.find({
      collection: 'categories',
      limit: 1000,
    })

    // Delete old categories that don't match our new structure
    const oldCategoryIds = [
      'usga-', 'home-training', 'fun', 'golf-beginners', 
      'beginners', 'practice', 'golf', '-',
      'golf-fundamentals', 'golf-course-management', 
      'beginner-golf', 'golf-practice', 'golf-rules',
      'golf-equipment', 'golf-instruction'
    ]

    for (const cat of existingCategories.docs) {
      if (oldCategoryIds.includes(cat.slug) || !cat.parent) {
        // Keep our new structure categories, delete old ones
        const isNewStructure = categoryStructure.some(
          parent => parent.slug === cat.slug || 
          parent.children.some(child => child.slug === cat.slug)
        )
        
        if (!isNewStructure) {
          await payload.delete({
            collection: 'categories',
            id: cat.id,
          })
          console.log(`削除: ${cat.title}`)
        }
      }
    }

    // Create new parent categories
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
        // Update existing category with Japanese title
        parent = await payload.update({
          collection: 'categories',
          id: existing.docs[0].id,
          data: {
            title: parentCategory.title,
            description: parentCategory.description,
            order: parentCategory.order,
          },
        })
        console.log(`更新された親カテゴリー: ${parentCategory.title}`)
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
        console.log(`作成された親カテゴリー: ${parentCategory.title}`)
      }

      parentCategories.set(parentCategory.slug, parent)

      // Create or update child categories
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
          await payload.update({
            collection: 'categories',
            id: existingChild.docs[0].id,
            data: {
              title: childCategory.title,
              description: childCategory.description,
              parent: parent.id,
              order: 0,
            },
          })
          console.log(`  - 更新された子カテゴリー: ${childCategory.title}`)
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
          console.log(`  - 作成された子カテゴリー: ${childCategory.title}`)
        }
      }
    }

    console.log('\n✅ 日本語カテゴリーの設定が完了しました！')
    console.log('\nカテゴリー構造:')
    for (const category of categoryStructure) {
      console.log(`\n${category.title} (${category.slug})`)
      for (const child of category.children) {
        console.log(`  - ${child.title} (${child.slug})`)
      }
    }

  } catch (error) {
    console.error('カテゴリー設定エラー:', error)
    process.exit(1)
  }

  process.exit(0)
}

setupCategoriesJapanese()