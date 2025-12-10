import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { generateBirdSpeciesPageSchema, type BirdData } from '@/utilities/generateStructuredData'
import { StructuredData } from '@/components/StructuredData'
import { BirdInfobox } from '@/components/BirdInfobox'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Bird data with SEO-optimized information and entity attributes
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
  'others': {
    name: 'その他の鳥',
    englishName: 'Other Birds & Conservation',
    image: '/birds/bird_in_jungle.webp',
    searchTerms: ['鳥', 'bird', 'ペット鳥', '小鳥', '野鳥', '保護'],
    description: '美しい小鳥たちの世界と、私たちが守るべき自然環境。小鳥たちの多様性と、彼らが直面する環境問題について学びましょう。',
    basicInfo: {
      origin: '世界各地の多様な生態系',
      lifespan: '自然環境では種により様々',
      size: '小型から中型まで多様',
      weight: '種により10g〜500g程度'
    },
    characteristics: [
      '生態系の重要な一員',
      '種子散布による森林再生への貢献',
      '害虫駆除による農業への恩恵',
      '美しい歌声による心の癒し'
    ],
    careTips: [
      '野鳥への餌付けは控えめに',
      '巣箱設置で繁殖を支援',
      'ガラス窓への衝突防止対策',
      '農薬不使用の庭作り'
    ],
    extendedInfo: {
      dietType: '種により様々',
      noiseLevel: '種により様々',
      careLevel: '種により様々',
      apartmentSuitable: '種により様々',
      socialNeeds: '種により様々',
      talkingAbility: '種により様々'
    }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const bird = birdData[slug as keyof typeof birdData]

  if (!bird) {
    return {
      title: 'Bird Not Found',
    }
  }

  const title = `${bird.name}の飼い方・特徴・関連記事 | かわいい小鳥`
  const description = `${bird.name}（${bird.englishName}）の基本情報、特徴、飼育方法を詳しく解説。${bird.description}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [bird.image],
      locale: 'ja_JP',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [bird.image],
    },
    alternates: {
      canonical: `/birds/${slug}`,
    },
  }
}

export default async function BirdCategoryPage({ params }: PageProps) {
  const { slug } = await params
  const bird = birdData[slug as keyof typeof birdData]

  if (!bird) {
    notFound()
  }

  const payload = await getPayload({ config })

  // For now, fetch all published posts and filter client-side
  // This avoids the complex query issue
  const { docs: allPosts } = await payload.find({
    collection: 'posts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000,
    sort: '-publishedAt',
    depth: 3, // Increased depth to ensure content and media are loaded
  })

  // Filter posts based on slug type
  let posts
  if (slug === 'others') {
    // For "その他", exclude posts that match any of the 6 main bird species
    const mainBirdTerms = [
      'セキセイインコ', 'budgerigar', 'バジー',
      'オカメインコ', 'cockatiel', 'カクテル',
      '文鳥', 'java sparrow', 'ブンチョウ',
      'カナリア', 'canary', 'カナリヤ',
      'コザクラインコ', 'lovebird', 'ラブバード',
      'フィンチ', 'finch', '十姉妹', 'ジュウシマツ'
    ]
    posts = allPosts.filter(post => {
      const title = post.title.toLowerCase()
      return !mainBirdTerms.some(term => title.includes(term.toLowerCase()))
    }).slice(0, 50)
  } else {
    // For specific bird species, filter by search terms
    posts = allPosts.filter(post => {
      const title = post.title.toLowerCase()
      return bird.searchTerms.some(term =>
        title.includes(term.toLowerCase())
      )
    }).slice(0, 50)
  }

  // Generate comprehensive structured data for SEO with Animal entity
  const structuredData = generateBirdSpeciesPageSchema(bird, slug, posts)

  return (
    <div className="min-h-screen bg-white">
      {/* Add structured data with Animal entity schema */}
      <StructuredData data={structuredData} />

      {/* Conditional rendering based on slug */}
      {slug === 'others' ? (
        <>
          {/* Hero Section with Nature Theme for Others Page */}
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            <Image
              src="/birds/bird_in_jungle.webp"
              alt="自然の中の小鳥たち"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
                その他の鳥と環境保護
              </h1>
              <p className="text-lg md:text-xl text-center max-w-3xl mb-6">
                美しい小鳥たちの世界と、私たちが守るべき自然環境
              </p>
              <Badge className="bg-white/90 text-green-800 text-lg px-6 py-2">
                {posts.length}件の関連記事
              </Badge>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="container mx-auto px-4 py-6">
            <nav className="flex items-center gap-2 text-sm" aria-label="パンくず">
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                ホーム
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link href="/#bird-types" className="text-gray-600 hover:text-green-600 transition-colors">
                鳥の種類
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-semibold">その他の鳥と環境保護</span>
            </nav>
          </div>
        </>
      ) : (
        <>
          {/* Original Hero Section for other bird pages */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50">
            <div className="container mx-auto px-4 py-12">
              {/* Breadcrumb Navigation for SEO */}
              <nav className="flex items-center gap-2 mb-6 text-sm" aria-label="パンくず">
                <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                  ホーム
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link href="/#bird-types" className="text-gray-600 hover:text-green-600 transition-colors">
                  鳥の種類
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-semibold">{bird.name}</span>
              </nav>

              {/* Main Bird Information with Infobox */}
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Left column: Title, Description, and Characteristics */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {bird.name}の飼い方と関連記事
                    </h1>
                    {bird.scientificName && (
                      <p className="text-sm italic text-gray-500 mb-4">
                        学名: {bird.scientificName}
                      </p>
                    )}
                    <p className="text-lg text-gray-700 mb-4">{bird.description}</p>
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
                      {posts.length}件の関連記事
                    </Badge>
                  </div>

                  {/* Characteristics and Care Tips */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Characteristics */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">特徴</h2>
                      <ul className="space-y-2">
                        {bird.characteristics.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Care Tips */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">飼育のポイント</h2>
                      <ul className="space-y-2">
                        {bird.careTips.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right column: Wikipedia-style Infobox */}
                <div className="lg:col-span-1">
                  <BirdInfobox
                    bird={bird}
                    slug={slug}
                    relatedBirds={Object.entries(birdData)
                      .filter(([key]) => key !== slug && key !== 'others')
                      .map(([key, data]) => ({ slug: key, name: data.name }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Special Conservation Content for Others Page */}
      {slug === 'others' && (
        <>
          {/* Introduction Section with gradient background */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      小鳥たちの美しい世界
                    </h2>
                    <p className="text-gray-700 mb-4">
                      地球上には約10,000種類の鳥類が存在し、それぞれが独自の美しさと
                      生態系での重要な役割を持っています。
                    </p>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>種子の散布による森林再生</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>花粉媒介による植物の繁殖支援</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>害虫駆除による生態系バランス維持</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>美しい歌声による心の癒し</span>
                      </li>
                    </ul>
                  </div>

                  <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src="/birds/natural_bird.webp"
                      alt="美しい小鳥たち"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conservation Section */}
          <div className="bg-white py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  私たちが守るべき自然環境
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">環境への脅威</h3>
                    <p className="text-gray-700 mb-4">
                      多くの小鳥たちが生息地の破壊、気候変動、環境汚染などの
                      深刻な脅威に直面しています。
                    </p>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>• 森林伐採による営巣地の減少</li>
                      <li>• 農薬使用による食物連鎖への影響</li>
                      <li>• プラスチック汚染による誤飲被害</li>
                      <li>• 都市化による生息域の分断</li>
                    </ul>
                  </div>

                  <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src="/birds/bird_in_jungle2.webp"
                      alt="自然環境の中の鳥"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

              {/* What We Can Do Section */}
              <div className="bg-emerald-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">私たちにできること</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🌳 生息地の保護</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 庭に在来植物を植える</li>
                      <li>• 巣箱を設置して繁殖を支援</li>
                      <li>• 水飲み場を提供する</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🌍 環境への配慮</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 農薬や化学物質の使用を控える</li>
                      <li>• プラスチックごみを減らす</li>
                      <li>• エコフレンドリーな製品を選ぶ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📚 知識の共有</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 野鳥観察会に参加する</li>
                      <li>• 子供たちに自然の大切さを教える</li>
                      <li>• SNSで保護活動を広める</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">💝 保護活動への参加</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 野鳥保護団体への寄付</li>
                      <li>• ボランティア活動への参加</li>
                      <li>• 地域の清掃活動に協力</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Additional Conservation Images and Message */}
              <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src="/birds/natural_bird2.webp"
                    alt="多様な鳥の種類"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col justify-center bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">未来への約束</h3>
                  <p className="text-gray-700 mb-4">
                    小さな鳥たちの美しい歌声は、自然が私たちに贈る最高のギフトです。
                  </p>
                  <p className="text-gray-700 italic">
                    「彼らの住む世界を守ることは、私たち自身の未来を守ることでもあります。
                    一人一人の小さな行動が、大きな変化を生み出す力になります。」
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Related Articles Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          {bird.name}に関する記事
        </h2>

        {/* Articles Grid */}
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              // Try to get hero image
              let heroImage: any = null
              let heroImageUrl: string | null = null

              if (post.heroImage) {
                // If it's a full media object with url
                if (typeof post.heroImage === 'object' && 'url' in post.heroImage) {
                  heroImage = post.heroImage
                  heroImageUrl = post.heroImage.url
                }
                // If it's just an ID (number or string) - use API endpoint
                else if (typeof post.heroImage === 'number' || typeof post.heroImage === 'string') {
                  heroImageUrl = `/api/files/file/${post.heroImage}`
                  heroImage = { url: heroImageUrl, alt: post.title }
                }
                // If it's an object with id property
                else if (typeof post.heroImage === 'object' && 'id' in post.heroImage) {
                  heroImageUrl = `/api/files/file/${post.heroImage.id}`
                  heroImage = { url: heroImageUrl, alt: post.title }
                }
              }

              // If no hero image, try to extract first image from content
              if (!heroImage && post.content) {
                try {
                  // Check if content is Lexical format
                  if (typeof post.content === 'object' && post.content.root) {
                    const findFirstImage = (node: any): any => {
                      // Check if this node is an upload (image)
                      if (node.type === 'upload' && node.value && typeof node.value === 'object') {
                        return node.value
                      }
                      // Check for inline images in text nodes
                      if (node.type === 'text' && node.text) {
                        // Look for image URLs in text (markdown style or direct URLs)
                        const imgMatch = node.text.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/) ||
                                        node.text.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i)
                        if (imgMatch) {
                          return { url: imgMatch[1] }
                        }
                      }
                      // Recursively search children
                      if (node.children && Array.isArray(node.children)) {
                        for (const child of node.children) {
                          const result = findFirstImage(child)
                          if (result) return result
                        }
                      }
                      return null
                    }

                    const firstImage = findFirstImage(post.content.root)
                    if (firstImage) {
                      heroImage = firstImage
                    }
                  }
                } catch (e) {
                  console.error('Error extracting image from content:', e)
                }
              }

              return (
                <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden bg-white">
                  <Link href={`/posts/${post.slug}`}>
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {heroImage ? (
                        <Image
                          src={heroImage.url}
                          alt={heroImage.alt || post.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-6xl">🐦</div>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold line-clamp-2 min-h-[3.5rem]">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="hover:text-green-600 transition-colors text-gray-900"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                    {post.meta?.description && (
                      <CardDescription className="line-clamp-2 mt-2 text-sm">
                        {post.meta.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">
              {bird.name}に関する記事は現在準備中です。
            </p>
          </div>
        )}

        {/* Related Bird Categories */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-xl font-bold text-gray-900 mb-4">関連する鳥の種類</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(birdData)
              .filter(([key]) => key !== slug)
              .map(([key, data]) => (
                <Link
                  key={key}
                  href={`/birds/${key}`}
                >
                  <Badge
                    variant="outline"
                    className="hover:bg-green-50 hover:border-green-600 transition-colors cursor-pointer text-base px-4 py-2"
                  >
                    {data.name}
                  </Badge>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}