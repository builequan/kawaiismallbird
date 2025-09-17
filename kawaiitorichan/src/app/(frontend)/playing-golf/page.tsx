import { Metadata } from 'next'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { getPayload } from 'payload'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import config from '@payload-config'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import Link from 'next/link'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { Badge } from '@/components/ui/badge'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { ChevronRight, Map, Brain, TrendingUp, Cloud, Trophy } from 'lucide-react'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import Image from 'next/image'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'プレー・戦略 - 賢いゴルフでスコアアップ',
  description: 'ゴルフコース管理、メンタルゲーム、戦略的プレーでスコア向上を目指しましょう。実戦で使える戦術とテクニックを詳しく解説。',
}

async function getCategoryData() {
  const payload = await getPayload({ config })
  
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'playing-golf' } },
    limit: 1,
  })

  const category = categories[0]
  if (!category) return { category: null, childCategories: [], posts: [] }

  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: { parent: { equals: category.id } },
    limit: 10,
    sort: 'title',
  })

  const categoryIds = [category.id, ...childCategories.map(c => c.id)]
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { categories: { in: categoryIds } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 12,
    sort: '-publishedAt',
    depth: 2,
  })

  return { category, childCategories, posts }
}

export default async function PlayingGolfPage() {
  const { category, childCategories, posts } = await getCategoryData()

  if (!category) return <div>カテゴリーが見つかりません</div>

  const categoryIcons = {
    'course-management': <Map className="w-8 h-8 text-green-600" />,
    'strategy-tactics': <Brain className="w-8 h-8 text-blue-600" />,
    'mental-game': <Brain className="w-8 h-8 text-purple-600" />,
    'scoring-improvement': <TrendingUp className="w-8 h-8 text-red-600" />,
    'weather-conditions': <Cloud className="w-8 h-8 text-gray-600" />,
    'different-formats': <Trophy className="w-8 h-8 text-yellow-600" />,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="hover:text-green-600 transition-colors">ホーム</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link href="/categories" className="hover:text-green-600 transition-colors">カテゴリー</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-900">プレー・戦略</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">🎯 プレー・戦略</h1>
          <p className="text-xl text-gray-700 mb-6">
            技術だけでなく、賢い戦略でゴルフを制する。
            コース管理、メンタルゲーム、スコアリング戦略で、あなたのゴルフを次のレベルへ導きます。
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>🎯 {posts.length}記事</span>
            <span>🧠 戦略的</span>
            <span>📊 スコア重視</span>
            <span>🏆 実戦的</span>
          </div>
        </div>
      </div>

      {/* Child Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">戦略カテゴリー</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {childCategories.map((child) => {
            const iconKey = child.slug as keyof typeof categoryIcons
            const icon = categoryIcons[iconKey] || <Map className="w-8 h-8 text-gray-600" />
            
            return (
              <Link key={child.id} href={`/categories/${child.slug}`}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">{icon}</div>
                    <CardTitle className="text-lg">{child.title}</CardTitle>
                    {child.description && (
                      <CardDescription className="text-sm">{child.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">詳細を見る →</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新記事</h2>
          <Link href="/categories/playing-golf" className="text-green-600 hover:text-green-700 font-medium">
            すべて見る →
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 6).map((post) => {
            const heroImage = post.hero && typeof post.hero === 'object' && 'url' in post.hero ? post.hero : null
              
            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {heroImage && (
                  <div className="relative w-full h-48">
                    <Image src={heroImage.url} alt={heroImage.alt || post.title} fill className="object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-600 text-white">プレー・戦略</Badge>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    <Link href={`/posts/${post.slug}`} className="hover:text-green-600 transition-colors">
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.meta?.description && (
                    <CardDescription className="line-clamp-3 text-sm">{post.meta.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {post.publishedAt && (
                      <span>{new Date(post.publishedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                    )}
                    {post.readingTime && <span>{post.readingTime}分読了</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">戦略的ゴルフでスコアを劇的に改善</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          正しい戦略と心構えで、同じスキルレベルでもスコアは大きく変わります。
          プロの思考法を学んで、あなたのゴルフを変革しましょう。
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/categories/course-management" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            コース管理
          </Link>
          <Link href="/categories/scoring-improvement" className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors">
            スコア改善
          </Link>
        </div>
      </div>
    </div>
  )
}