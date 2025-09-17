import { Metadata } from 'next'

import { getPayload } from 'payload'

import config from '@payload-config'

import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

import { ChevronRight, BookOpen, Users, Heart, Trophy, Briefcase, Clock } from 'lucide-react'

import Image from 'next/image'

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ゴルフライフ - ゴルフを生活の一部に',
  description: 'ゴルフのルール、エチケット、文化から競技まで。ゴルフを心から楽しむためのライフスタイルガイドです。',
}

async function getCategoryData() {
  const payload = await getPayload({ config })
  
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'golf-life' } },
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

export default async function GolfLifePage() {
  const { category, childCategories, posts } = await getCategoryData()

  if (!category) return <div>カテゴリーが見つかりません</div>

  const categoryIcons = {
    'rules-regulations': <BookOpen className="w-8 h-8 text-blue-600" />,
    'etiquette-culture': <Users className="w-8 h-8 text-green-600" />,
    'golf-lifestyle': <Heart className="w-8 h-8 text-pink-600" />,
    'competitions-events': <Trophy className="w-8 h-8 text-yellow-600" />,
    'golf-business': <Briefcase className="w-8 h-8 text-purple-600" />,
    'history-traditions': <Clock className="w-8 h-8 text-gray-600" />,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="hover:text-green-600 transition-colors">ホーム</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link href="/categories" className="hover:text-green-600 transition-colors">カテゴリー</Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-900">ゴルフライフ</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">💚 ゴルフライフ</h1>
          <p className="text-xl text-gray-700 mb-6">
            ゴルフは単なるスポーツではなく、ライフスタイルです。
            ルール、エチケット、文化を学び、ゴルフを心から楽しむ方法を発見しましょう。
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>🏌️ {posts.length}記事</span>
            <span>🤝 エチケット</span>
            <span>📜 ルール</span>
            <span>🏆 競技情報</span>
          </div>
        </div>
      </div>

      {/* Child Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">ライフスタイルカテゴリー</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {childCategories.map((child) => {
            const iconKey = child.slug as keyof typeof categoryIcons
            const icon = categoryIcons[iconKey] || <Heart className="w-8 h-8 text-gray-600" />
            
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

      {/* Featured Sections */}
      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              ゴルフルール完全ガイド
            </CardTitle>
            <CardDescription>
              最新のゴルフルールを分かりやすく解説。コースで困らないための必須知識
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/categories/rules-regulations"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              ルールを学ぶ <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              ゴルフエチケット・マナー
            </CardTitle>
            <CardDescription>
              紳士・淑女のスポーツとしてのゴルフマナーを身につけよう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/categories/etiquette-culture"
              className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
            >
              エチケットを学ぶ <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新記事</h2>
          <Link href="/categories/golf-life" className="text-green-600 hover:text-green-700 font-medium">
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
                      <Badge className="bg-purple-600 text-white">ゴルフライフ</Badge>
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
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">ゴルフライフをもっと豊かに</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          ゴルフの技術だけでなく、マナーや文化を理解することで、
          より深くゴルフを楽しむことができます。一生涯の趣味として極めていきましょう。
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/categories/etiquette-culture" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            エチケットを学ぶ
          </Link>
          <Link href="/categories/competitions-events" className="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors">
            競技情報
          </Link>
        </div>
      </div>
    </div>
  )
}