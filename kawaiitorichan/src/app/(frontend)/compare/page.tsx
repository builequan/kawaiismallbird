import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { StructuredData } from '@/components/StructuredData'
import { generateBreadcrumbSchema } from '@/utilities/generateStructuredData'

// Force dynamic rendering to avoid build-time DB connection issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '鳥の種類を比較 | かわいい小鳥',
  description: 'セキセイインコ、オカメインコ、文鳥、カナリア、コザクラインコ、フィンチなど、人気の小鳥を徹底比較。飼いやすさ、鳴き声、寿命、性格など、あなたに合った鳥を見つけましょう。',
  openGraph: {
    title: '鳥の種類を比較 | かわいい小鳥',
    description: '人気の小鳥を徹底比較。あなたに合った鳥を見つけましょう。',
    locale: 'ja_JP',
    type: 'website',
  },
  alternates: {
    canonical: '/compare',
  },
}

// Bird data for comparison index
const birds = [
  { slug: 'budgerigar', name: 'セキセイインコ', englishName: 'Budgerigar', image: '/birds/budgerigar.webp' },
  { slug: 'cockatiel', name: 'オカメインコ', englishName: 'Cockatiel', image: '/birds/cockatiel.webp' },
  { slug: 'java-sparrow', name: '文鳥', englishName: 'Java Sparrow', image: '/birds/java-sparrow.webp' },
  { slug: 'canary', name: 'カナリア', englishName: 'Canary', image: '/birds/canary.webp' },
  { slug: 'lovebird', name: 'コザクラインコ', englishName: 'Lovebird', image: '/birds/lovebird.webp' },
  { slug: 'finch', name: 'フィンチ', englishName: 'Finch', image: '/birds/finch.webp' },
]

// Generate all comparison pairs
function generateComparisonPairs() {
  const pairs: Array<{ bird1: typeof birds[0]; bird2: typeof birds[0] }> = []

  for (let i = 0; i < birds.length; i++) {
    for (let j = i + 1; j < birds.length; j++) {
      pairs.push({ bird1: birds[i], bird2: birds[j] })
    }
  }

  return pairs
}

// Popular comparisons (hand-picked for SEO)
const popularComparisons = [
  { slug1: 'budgerigar', slug2: 'cockatiel', description: '人気No.1とNo.2の対決！初心者向けの定番比較' },
  { slug1: 'budgerigar', slug2: 'java-sparrow', description: 'にぎやかなインコと静かな文鳥、どちらが好み？' },
  { slug1: 'cockatiel', slug2: 'lovebird', description: '中型インコ同士の比較。性格の違いに注目' },
  { slug1: 'java-sparrow', slug2: 'canary', description: '美声対決！静かな文鳥とさえずりのカナリア' },
  { slug1: 'canary', slug2: 'finch', description: '種子食の小型鳥、どちらが飼いやすい？' },
  { slug1: 'lovebird', slug2: 'budgerigar', description: '活発なインコ同士、性格と飼育難易度の違いは？' },
]

export default function CompareIndexPage() {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://kawaiitorichan.com'

  const breadcrumbItems = [
    { name: 'ホーム', url: serverUrl },
    { name: '鳥の比較', url: `${serverUrl}/compare` },
  ]
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)

  const allPairs = generateComparisonPairs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <StructuredData data={breadcrumbSchema} />

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 mb-8 text-sm" aria-label="パンくず">
          <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
            ホーム
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">鳥の比較</span>
        </nav>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🐦 鳥の種類を比較
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            人気の小鳥たちを徹底比較！寿命、性格、飼いやすさ、鳴き声など、
            様々な観点から比較して、あなたにぴったりの鳥を見つけましょう。
          </p>
        </div>

        {/* Popular Comparisons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            人気の比較
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularComparisons.map((comparison) => {
              const bird1 = birds.find(b => b.slug === comparison.slug1)!
              const bird2 = birds.find(b => b.slug === comparison.slug2)!

              return (
                <Link
                  key={`${comparison.slug1}-${comparison.slug2}`}
                  href={`/compare/${comparison.slug1}/vs/${comparison.slug2}`}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  <div className="flex">
                    <div className="relative w-1/2 h-32">
                      <Image
                        src={bird1.image}
                        alt={bird1.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-green-600/20 group-hover:bg-green-600/30 transition-colors" />
                    </div>
                    <div className="relative w-1/2 h-32">
                      <Image
                        src={bird2.image}
                        alt={bird2.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {bird1.name} vs {bird2.name}
                    </h3>
                    <p className="text-sm text-gray-600">{comparison.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* All Comparisons */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            すべての比較
          </h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">比較</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allPairs.map(({ bird1, bird2 }) => (
                    <tr key={`${bird1.slug}-${bird2.slug}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image src={bird1.image} alt={bird1.name} fill className="object-cover" />
                          </div>
                          <span className="font-medium text-gray-900">{bird1.name}</span>
                          <span className="text-gray-400">vs</span>
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image src={bird2.image} alt={bird2.name} fill className="object-cover" />
                          </div>
                          <span className="font-medium text-gray-900">{bird2.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/compare/${bird1.slug}/vs/${bird2.slug}`}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          比較する
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quick Compare Tool */}
        <section className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            各鳥の詳細ページ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {birds.map((bird) => (
              <Link
                key={bird.slug}
                href={`/birds/${bird.slug}`}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors group"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-2">
                  <Image src={bird.image} alt={bird.name} fill className="object-cover" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center group-hover:text-green-700">
                  {bird.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
