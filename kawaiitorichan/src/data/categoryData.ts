export interface CategoryData {
  slug: string
  title: string
  englishTitle: string
  heroImage: string
  description: string
  color: string
  icon: string
  features: string[]
}

export const categoryData: Record<string, CategoryData> = {
  'bird-care': {
    slug: 'bird-care',
    title: '鳥の飼い方',
    englishTitle: 'Bird Care',
    heroImage: '/category-images/bird-care-hero.jpg',
    description: '愛鳥との幸せな生活のための飼育方法、日常のお世話、環境づくりのコツをご紹介します。',
    color: 'from-green-500 to-emerald-600',
    icon: '🏠',
    features: [
      '飼育環境・ケージ設定',
      '健康・獣医ケア',
      '栄養・餌やり',
      '行動・トレーニング',
      '法律・倫理・飼育の考慮'
    ]
  },
  'bird-health': {
    slug: 'bird-health',
    title: '鳥の健康',
    englishTitle: 'Bird Health',
    heroImage: '/category-images/bird-health-hero.jpg',
    description: '愛鳥の健康管理、病気の予防、症状の見分け方など、健康維持に必要な情報をお届けします。',
    color: 'from-blue-500 to-cyan-600',
    icon: '💊',
    features: [
      '健康診断と予防',
      '一般的な病気',
      '緊急時の対処',
      '栄養管理',
      '獣医との連携'
    ]
  },
  'bird-species': {
    slug: 'bird-species',
    title: '鳥の種類',
    englishTitle: 'Bird Species',
    heroImage: '/category-images/bird-species-hero.jpg',
    description: '世界中の美しい鳥たち。ペットとして人気の種類から野鳥まで、多様な鳥の世界を探索しましょう。',
    color: 'from-purple-500 to-pink-600',
    icon: '🦜',
    features: [
      'インコ・オウム類',
      'フィンチ類',
      '文鳥・カナリア',
      '野鳥の種類',
      '希少種・保護種'
    ]
  },
  'bird-ecology': {
    slug: 'bird-ecology',
    title: '鳥の生態',
    englishTitle: 'Bird Ecology',
    heroImage: '/category-images/bird-ecology-hero.jpg',
    description: '鳥たちの自然な行動、生息地、繁殖、渡りなど、驚くべき生態について学びましょう。',
    color: 'from-amber-500 to-orange-600',
    icon: '🌿',
    features: [
      '自然な行動パターン',
      '繁殖と子育て',
      '渡り鳥の生態',
      '生息地と環境',
      '進化と適応'
    ]
  },
  'bird-goods': {
    slug: 'bird-goods',
    title: '鳥のグッズ',
    englishTitle: 'Bird Goods',
    heroImage: '/category-images/bird-goods-hero.jpg',
    description: 'ケージ、おもちゃ、餌など、愛鳥のための最適なグッズ選びをサポートします。',
    color: 'from-rose-500 to-red-600',
    icon: '🎁',
    features: [
      'ケージ・飼育用品',
      'おもちゃ・遊具',
      '餌・栄養補助',
      'ケア用品',
      'おすすめグッズ'
    ]
  },
  'bird-photos': {
    slug: 'bird-photos',
    title: '鳥の写真',
    englishTitle: 'Bird Photography',
    heroImage: '/category-images/bird-photos-hero.jpg',
    description: '美しい鳥たちの写真撮影テクニック、機材選び、撮影スポットをご紹介します。',
    color: 'from-indigo-500 to-blue-600',
    icon: '📸',
    features: [
      '撮影テクニック',
      'カメラ・レンズ選び',
      '撮影スポット',
      '写真編集',
      'フォトギャラリー'
    ]
  },
  'pet-birds': {
    slug: 'pet-birds',
    title: '飼い鳥',
    englishTitle: 'Pet Birds',
    heroImage: '/category-images/pet-birds-hero.jpg',
    description: 'ペットとして人気の鳥たちの特徴、性格、飼育のポイントを詳しく解説します。',
    color: 'from-teal-500 to-green-600',
    icon: '🏡',
    features: [
      '人気のペット鳥',
      '初心者向け種類',
      '性格と特徴',
      '飼育の基本',
      'ペットとの生活'
    ]
  },
  'wild-birds': {
    slug: 'wild-birds',
    title: '野鳥観察',
    englishTitle: 'Wild Bird Watching',
    heroImage: '/category-images/wild-birds-hero.jpg',
    description: 'バードウォッチングの楽しみ方、観察スポット、識別のコツをお伝えします。',
    color: 'from-green-600 to-teal-700',
    icon: '🔭',
    features: [
      '観察の基本',
      'おすすめスポット',
      '種類の識別',
      '季節の野鳥',
      '観察記録'
    ]
  },
  'conservation': {
    slug: 'conservation',
    title: '保護活動',
    englishTitle: 'Conservation',
    heroImage: '/category-images/conservation-hero.jpg',
    description: '鳥たちを守る保護活動、環境問題、私たちにできることを考えます。',
    color: 'from-emerald-600 to-green-700',
    icon: '🌍',
    features: [
      '絶滅危惧種',
      '環境保護',
      'ボランティア活動',
      '保護団体',
      '私たちにできること'
    ]
  },
  'habitats': {
    slug: 'habitats',
    title: '生息地',
    englishTitle: 'Habitats',
    heroImage: '/category-images/habitats-hero.jpg',
    description: '森林、湿地、海岸など、様々な環境に生きる鳥たちの生息地を探訪します。',
    color: 'from-cyan-600 to-blue-700',
    icon: '🌲',
    features: [
      '森林の鳥',
      '水辺の鳥',
      '都市の鳥',
      '山地の鳥',
      '海岸の鳥'
    ]
  },
  'photography': {
    slug: 'photography',
    title: '撮影技術',
    englishTitle: 'Photography Techniques',
    heroImage: '/category-images/photography-hero.jpg',
    description: 'プロが教える野鳥撮影のコツ、機材の選び方、撮影マナーについて学びます。',
    color: 'from-purple-600 to-indigo-700',
    icon: '📷',
    features: [
      '撮影の基本技術',
      '機材選びのコツ',
      '構図とライティング',
      'ポストプロセス',
      '撮影マナー'
    ]
  },
  'birdwatching-gear': {
    slug: 'birdwatching-gear',
    title: '観察用具',
    englishTitle: 'Birdwatching Gear',
    heroImage: '/category-images/birdwatching-gear-hero.jpg',
    description: '双眼鏡、望遠鏡、図鑑など、バードウォッチングに必要な道具の選び方をご案内します。',
    color: 'from-gray-600 to-gray-800',
    icon: '🔍',
    features: [
      '双眼鏡の選び方',
      '望遠鏡・スコープ',
      '図鑑・アプリ',
      '撮影機材',
      'フィールドノート'
    ]
  }
}

// Helper function to get category by slug
export const getCategoryBySlug = (slug: string): CategoryData | undefined => {
  return categoryData[slug]
}

// Get all category slugs for static paths
export const getAllCategorySlugs = (): string[] => {
  return Object.keys(categoryData)
}