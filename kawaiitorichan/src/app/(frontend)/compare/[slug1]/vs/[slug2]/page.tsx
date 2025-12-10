import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ChevronRight, Check, X, Minus } from 'lucide-react'
import { StructuredData } from '@/components/StructuredData'
import { generateBreadcrumbSchema } from '@/utilities/generateStructuredData'
import type { BirdData } from '@/utilities/generateStructuredData'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    slug1: string
    slug2: string
  }>
}

// Bird data (same as in birds/[slug]/page.tsx - could be moved to a shared module)
const birdData: Record<string, BirdData> = {
  'budgerigar': {
    name: 'セキセイインコ',
    englishName: 'Budgerigar',
    scientificName: 'Melopsittacus undulatus',
    image: '/birds/budgerigar.webp',
    searchTerms: ['セキセイインコ', 'budgerigar', 'バジー', 'インコ'],
    description: 'オーストラリア原産の人気ペット鳥。初心者にも飼いやすく、美しい色彩と社交的な性格が特徴です。',
    basicInfo: {
      origin: 'オーストラリア',
      lifespan: '5〜10年',
      size: '体長約18cm',
      weight: '30〜40g'
    },
    characteristics: [
      '社交的で人懐っこい性格',
      '豊富なカラーバリエーション',
      '言葉を覚える能力がある',
      '群れで生活することを好む'
    ],
    careTips: [
      '毎日の放鳥時間を確保する',
      '新鮮な水と多様な餌を提供',
      'ケージは広めのものを選ぶ',
      '温度管理に注意（20〜25度が理想）'
    ],
    extendedInfo: {
      dietType: '雑食性（種子、野菜、果物）',
      noiseLevel: '中程度',
      careLevel: '初心者向け',
      apartmentSuitable: '適している',
      socialNeeds: '高い（毎日の交流が必要）',
      talkingAbility: 'あり（単語や短いフレーズ）',
      colors: ['グリーン', 'ブルー', 'イエロー', 'ホワイト', 'バイオレット'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/セキセイインコ'
    }
  },
  'cockatiel': {
    name: 'オカメインコ',
    englishName: 'Cockatiel',
    scientificName: 'Nymphicus hollandicus',
    image: '/birds/cockatiel.webp',
    searchTerms: ['オカメインコ', 'cockatiel', 'カクテル', 'オカメ'],
    description: '特徴的な冠羽を持つオーストラリア原産の中型インコ。口笛が得意で、温和な性格から家族向けペットとして人気です。',
    basicInfo: {
      origin: 'オーストラリア',
      lifespan: '15〜20年',
      size: '体長約30cm',
      weight: '80〜120g'
    },
    characteristics: [
      '頭部の美しい冠羽',
      '口笛や歌が得意',
      '温和で穏やかな性格',
      '飼い主との絆を大切にする'
    ],
    careTips: [
      '広めのケージと止まり木を用意',
      '毎日のスキンシップが重要',
      '羽粉が多いので掃除をこまめに',
      'バランスの良い食事管理'
    ],
    extendedInfo: {
      dietType: '雑食性（種子、ペレット、野菜）',
      noiseLevel: '中〜高（口笛が多い）',
      careLevel: '初心者〜中級者向け',
      apartmentSuitable: '条件付きで適している',
      socialNeeds: '非常に高い（寂しがり屋）',
      talkingAbility: '限定的（口笛やメロディが得意）',
      colors: ['ノーマルグレー', 'ルチノー', 'パール', 'シナモン', 'パイド'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/オカメインコ'
    }
  },
  'java-sparrow': {
    name: '文鳥',
    englishName: 'Java Sparrow',
    scientificName: 'Lonchura oryzivora',
    image: '/birds/java-sparrow.webp',
    searchTerms: ['文鳥', 'java sparrow', 'ブンチョウ', 'ぶんちょう'],
    description: '日本で古くから愛される小型の鳥。静かで飼いやすく、美しい鳴き声と上品な姿が魅力的です。',
    basicInfo: {
      origin: 'インドネシア（ジャワ島）',
      lifespan: '7〜8年',
      size: '体長約14cm',
      weight: '20〜25g'
    },
    characteristics: [
      '静かで落ち着いた性格',
      '美しい鳴き声',
      '手乗りにしやすい',
      'つがいで飼うと仲睦まじい'
    ],
    careTips: [
      '静かな環境を好む',
      '水浴びを好むので水浴び容器を用意',
      '寒さに弱いので保温対策必須',
      '繊細な性格なので優しく接する'
    ],
    extendedInfo: {
      dietType: '種子食（シード中心）',
      noiseLevel: '低い（静か）',
      careLevel: '初心者向け',
      apartmentSuitable: '非常に適している',
      socialNeeds: '中程度（つがいでの飼育推奨）',
      talkingAbility: 'なし',
      colors: ['桜文鳥', '白文鳥', 'シナモン', 'シルバー'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/ブンチョウ'
    }
  },
  'canary': {
    name: 'カナリア',
    englishName: 'Canary',
    scientificName: 'Serinus canaria domestica',
    image: '/birds/canary.webp',
    searchTerms: ['カナリア', 'canary', 'カナリヤ'],
    description: 'カナリア諸島原産の美声の持ち主。鮮やかな黄色の羽と美しいさえずりで、観賞用・鑑賞用として世界中で愛されています。',
    basicInfo: {
      origin: 'カナリア諸島',
      lifespan: '10〜15年',
      size: '体長約12〜13cm',
      weight: '15〜20g'
    },
    characteristics: [
      '美しい歌声で有名',
      '鮮やかな黄色が代表的',
      '比較的丈夫で飼いやすい',
      'オスの方がよく鳴く'
    ],
    careTips: [
      '単独飼育が基本',
      '歌の練習には静かな環境が必要',
      '日光浴を好む',
      'カナリアシードを主食に'
    ],
    extendedInfo: {
      dietType: '種子食（カナリアシード中心）',
      noiseLevel: '中程度（美しいさえずり）',
      careLevel: '初心者向け',
      apartmentSuitable: '適している',
      socialNeeds: '低い（単独飼育可能）',
      talkingAbility: 'なし（歌声のみ）',
      colors: ['イエロー', 'オレンジ', 'レッド', 'ホワイト', 'モザイク'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/カナリア'
    }
  },
  'lovebird': {
    name: 'コザクラインコ',
    englishName: 'Peach-faced Lovebird',
    scientificName: 'Agapornis roseicollis',
    image: '/birds/lovebird.webp',
    searchTerms: ['コザクラインコ', 'lovebird', 'ラブバード', 'ボタンインコ'],
    description: 'アフリカ原産の小型インコ。愛情深い性格で、パートナーとの強い絆を築くことから「ラブバード」と呼ばれています。',
    basicInfo: {
      origin: 'アフリカ南西部',
      lifespan: '10〜15年',
      size: '体長約15cm',
      weight: '45〜55g'
    },
    characteristics: [
      '愛情深くパートナーと強い絆を築く',
      'カラフルな羽色',
      '活発で遊び好き',
      '知能が高く芸を覚える'
    ],
    careTips: [
      'ペアで飼育するのが理想的',
      '十分な遊び道具を用意',
      '噛む力が強いので注意',
      '毎日の交流時間を確保'
    ],
    extendedInfo: {
      dietType: '雑食性（種子、野菜、果物）',
      noiseLevel: '高い（活発に鳴く）',
      careLevel: '中級者向け',
      apartmentSuitable: '条件付き（防音対策推奨）',
      socialNeeds: '非常に高い（ペア飼育推奨）',
      talkingAbility: '限定的（単語程度）',
      colors: ['ノーマルグリーン', 'ルチノー', 'オパーリン', 'バイオレット', 'パイド'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/コザクラインコ'
    }
  },
  'finch': {
    name: 'フィンチ',
    englishName: 'Finch',
    scientificName: 'Fringillidae / Estrildidae',
    image: '/birds/finch.webp',
    searchTerms: ['フィンチ', 'finch', '十姉妹', 'ジュウシマツ', 'キンカチョウ'],
    description: '多様な種類が存在する小型の鳥。群れで生活することを好み、美しいさえずりと活発な動きが特徴です。',
    basicInfo: {
      origin: '世界各地',
      lifespan: '5〜10年',
      size: '体長約10〜15cm',
      weight: '10〜20g'
    },
    characteristics: [
      '群れで生活することを好む',
      '種類により多様な色彩',
      '活発で観察が楽しい',
      '陽気なさえずり'
    ],
    careTips: [
      '複数飼育が推奨',
      '広めの飛行スペースが必要',
      '種子を中心とした食事',
      '群れの相性に注意'
    ],
    extendedInfo: {
      dietType: '種子食',
      noiseLevel: '低〜中程度',
      careLevel: '初心者向け',
      apartmentSuitable: '非常に適している',
      socialNeeds: '高い（複数飼育推奨）',
      talkingAbility: 'なし',
      colors: ['種類により様々'],
      wikipediaUrl: 'https://ja.wikipedia.org/wiki/フィンチ'
    }
  },
}

// Get comparison rating for attributes
function getComparisonRating(value: string | undefined): 'positive' | 'neutral' | 'negative' {
  if (!value) return 'neutral'
  const lowerValue = value.toLowerCase()

  // Positive indicators
  if (lowerValue.includes('初心者') || lowerValue.includes('適している') || lowerValue.includes('低い') || lowerValue.includes('あり')) {
    return 'positive'
  }

  // Negative indicators
  if (lowerValue.includes('上級') || lowerValue.includes('高い') || lowerValue.includes('条件付き') || lowerValue.includes('なし')) {
    return 'negative'
  }

  return 'neutral'
}

// Render comparison icon
function ComparisonIcon({ rating }: { rating: 'positive' | 'neutral' | 'negative' }) {
  if (rating === 'positive') {
    return <Check className="w-4 h-4 text-green-600" />
  }
  if (rating === 'negative') {
    return <X className="w-4 h-4 text-red-500" />
  }
  return <Minus className="w-4 h-4 text-gray-400" />
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug1, slug2 } = await params
  const bird1 = birdData[slug1]
  const bird2 = birdData[slug2]

  if (!bird1 || !bird2) {
    return { title: 'Page Not Found' }
  }

  const title = `${bird1.name} vs ${bird2.name} - 徹底比較 | かわいい小鳥`
  const description = `${bird1.name}（${bird1.englishName}）と${bird2.name}（${bird2.englishName}）の違いを徹底比較。寿命、性格、飼いやすさ、鳴き声など、どちらがあなたに合うか解説します。`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: 'ja_JP',
      type: 'website',
    },
    alternates: {
      canonical: `/compare/${slug1}/vs/${slug2}`,
    },
  }
}

export default async function BirdComparisonPage({ params }: PageProps) {
  const { slug1, slug2 } = await params
  const bird1 = birdData[slug1]
  const bird2 = birdData[slug2]

  if (!bird1 || !bird2 || slug1 === slug2) {
    notFound()
  }

  // Generate structured data
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://kawaiitorichan.com'

  const breadcrumbItems = [
    { name: 'ホーム', url: serverUrl },
    { name: '鳥の比較', url: `${serverUrl}/compare` },
    { name: `${bird1.name} vs ${bird2.name}`, url: `${serverUrl}/compare/${slug1}/vs/${slug2}` },
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  // Comparison structured data
  const comparisonSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${bird1.name} vs ${bird2.name} 比較`,
    description: `${bird1.name}と${bird2.name}の徹底比較ガイド`,
    url: `${serverUrl}/compare/${slug1}/vs/${slug2}`,
    about: [
      {
        '@type': 'Animal',
        name: bird1.name,
        alternateName: bird1.englishName,
        description: bird1.description,
      },
      {
        '@type': 'Animal',
        name: bird2.name,
        alternateName: bird2.englishName,
        description: bird2.description,
      },
    ],
    breadcrumb: breadcrumbSchema,
    inLanguage: 'ja',
  }

  // Comparison categories
  const comparisonCategories = [
    { key: 'lifespan', label: '寿命', value1: bird1.basicInfo.lifespan, value2: bird2.basicInfo.lifespan },
    { key: 'size', label: '体長', value1: bird1.basicInfo.size, value2: bird2.basicInfo.size },
    { key: 'weight', label: '体重', value1: bird1.basicInfo.weight, value2: bird2.basicInfo.weight },
    { key: 'origin', label: '原産地', value1: bird1.basicInfo.origin, value2: bird2.basicInfo.origin },
    { key: 'dietType', label: '食性', value1: bird1.extendedInfo?.dietType, value2: bird2.extendedInfo?.dietType },
    { key: 'noiseLevel', label: '鳴き声', value1: bird1.extendedInfo?.noiseLevel, value2: bird2.extendedInfo?.noiseLevel },
    { key: 'careLevel', label: '飼育難易度', value1: bird1.extendedInfo?.careLevel, value2: bird2.extendedInfo?.careLevel },
    { key: 'apartmentSuitable', label: 'マンション適性', value1: bird1.extendedInfo?.apartmentSuitable, value2: bird2.extendedInfo?.apartmentSuitable },
    { key: 'socialNeeds', label: '社会性', value1: bird1.extendedInfo?.socialNeeds, value2: bird2.extendedInfo?.socialNeeds },
    { key: 'talkingAbility', label: 'おしゃべり', value1: bird1.extendedInfo?.talkingAbility, value2: bird2.extendedInfo?.talkingAbility },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <StructuredData data={[comparisonSchema, breadcrumbSchema]} />

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 mb-8 text-sm" aria-label="パンくず">
          <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
            ホーム
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/#bird-types" className="text-gray-600 hover:text-green-600 transition-colors">
            鳥の種類
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">{bird1.name} vs {bird2.name}</span>
        </nav>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {bird1.name} vs {bird2.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {bird1.name}と{bird2.name}、どちらがあなたに合っているでしょうか？
            基本情報から飼育のポイントまで徹底比較します。
          </p>
        </div>

        {/* Bird Cards Header */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Bird 1 Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64">
              <Image
                src={bird1.image}
                alt={bird1.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{bird1.name}</h2>
                <p className="text-white/80 text-sm">{bird1.englishName}</p>
                {bird1.scientificName && (
                  <p className="text-white/60 text-xs italic">{bird1.scientificName}</p>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm">{bird1.description}</p>
              <Link
                href={`/birds/${slug1}`}
                className="inline-block mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                詳しく見る →
              </Link>
            </div>
          </div>

          {/* Bird 2 Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-64">
              <Image
                src={bird2.image}
                alt={bird2.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-2xl font-bold">{bird2.name}</h2>
                <p className="text-white/80 text-sm">{bird2.englishName}</p>
                {bird2.scientificName && (
                  <p className="text-white/60 text-xs italic">{bird2.scientificName}</p>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm">{bird2.description}</p>
              <Link
                href={`/birds/${slug2}`}
                className="inline-block mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                詳しく見る →
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">詳細比較表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">項目</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-green-700">{bird1.name}</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">{bird2.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonCategories.map((category) => (
                  <tr key={category.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{category.label}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ComparisonIcon rating={getComparisonRating(category.value1)} />
                        <span>{category.value1 || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ComparisonIcon rating={getComparisonRating(category.value2)} />
                        <span>{category.value2 || '-'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Characteristics Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </span>
              {bird1.name}の特徴
            </h3>
            <ul className="space-y-3">
              {bird1.characteristics.map((char, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 mt-1">•</span>
                  {char}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-blue-600" />
              </span>
              {bird2.name}の特徴
            </h3>
            <ul className="space-y-3">
              {bird2.characteristics.map((char, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 mt-1">•</span>
                  {char}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Care Tips Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{bird1.name}の飼育ポイント</h3>
            <ul className="space-y-3">
              {bird1.careTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 font-bold">{index + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{bird2.name}の飼育ポイント</h3>
            <ul className="space-y-3">
              {bird2.careTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 font-bold">{index + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendation Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">どちらを選ぶ？</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {bird1.name}と{bird2.name}、それぞれに魅力があります。
            あなたのライフスタイルや住環境に合った鳥を選びましょう。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/birds/${slug1}`}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {bird1.name}について詳しく
            </Link>
            <Link
              href={`/birds/${slug2}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {bird2.name}について詳しく
            </Link>
          </div>
        </div>

        {/* Other Comparisons */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">他の比較を見る</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(birdData)
              .filter(([key]) => key !== slug1 && key !== slug2 && key !== 'others')
              .slice(0, 4)
              .map(([key, bird]) => (
                <Link
                  key={key}
                  href={`/compare/${slug1}/vs/${key}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  {bird1.name} vs {bird.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
