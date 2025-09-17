import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, BookOpen, Users, Target, MessageSquare } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '基礎・入門 - ゴルフを始める全ての人へ',
  description: 'ゴルフの基本知識と初心者向けの基礎概念を学びましょう。はじめてのゴルフから基本テクニックまで、包括的なガイドをご紹介します。',
}

async function getCategoryData() {
  const payload = await getPayload({ config })
  
  // Get fundamentals category and its children
  const { docs: fundamentalsCategories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: 'fundamentals',
      },
    },
    limit: 1,
  })

  const fundamentalsCategory = fundamentalsCategories[0]
  
  if (!fundamentalsCategory) {
    return { category: null, childCategories: [], posts: [] }
  }

  // Get child categories
  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: {
      parent: {
        equals: fundamentalsCategory.id,
      },
    },
    limit: 10,
    sort: 'title',
  })

  // Get all category IDs to query posts
  const categoryIds = [fundamentalsCategory.id, ...childCategories.map(c => c.id)]

  // Get recent posts in fundamentals categories
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      and: [
        {
          categories: {
            in: categoryIds,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
    limit: 12,
    sort: '-publishedAt',
    depth: 2,
  })

  return {
    category: fundamentalsCategory,
    childCategories,
    posts,
  }
}

export default async function FundamentalsPage() {
  const { category, childCategories, posts } = await getCategoryData()

  if (!category) {
    return <div>カテゴリーが見つかりません</div>
  }

  // Icons for each subcategory
  const categoryIcons = {
    'getting-started': <BookOpen className="w-8 h-8 text-green-600" />,
    'basic-techniques': <Target className="w-8 h-8 text-blue-600" />,
    'golf-basics': <Users className="w-8 h-8 text-purple-600" />,
    'terminology-concepts': <MessageSquare className="w-8 h-8 text-orange-600" />,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="hover:text-green-600 transition-colors">
          ホーム
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <Link href="/categories" className="hover:text-green-600 transition-colors">
          カテゴリー
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="font-semibold text-gray-900">基礎・入門</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            🏌️ 基礎・入門
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            ゴルフの世界へようこそ！初心者からゴルフを始める方、基礎をしっかり学びたい方のための包括的なガイドです。
            正しい基礎知識と技術を身につけて、楽しいゴルフライフをスタートしましょう。
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>📚 {posts.length}記事</span>
            <span>⭐ 初心者向け</span>
            <span>🎯 基礎重視</span>
            <span>📝 ステップバイステップ</span>
          </div>
        </div>
      </div>

      {/* Child Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">学習カテゴリー</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {childCategories.map((child) => {
            const iconKey = child.slug as keyof typeof categoryIcons
            const icon = categoryIcons[iconKey] || <BookOpen className="w-8 h-8 text-gray-600" />
            
            return (
              <Link key={child.id} href={`/categories/${child.slug}`}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      {icon}
                    </div>
                    <CardTitle className="text-lg">{child.title}</CardTitle>
                    {child.description && (
                      <CardDescription className="text-sm">
                        {child.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        詳細を見る →
                      </Badge>
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
          <Link 
            href="/categories/fundamentals" 
            className="text-green-600 hover:text-green-700 font-medium"
          >
            すべて見る →
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 6).map((post) => {
            const heroImage = post.hero && typeof post.hero === 'object' && 'url' in post.hero 
              ? post.hero 
              : null
              
            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {heroImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={heroImage.url}
                      alt={heroImage.alt || post.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-600 text-white">
                        基礎・入門
                      </Badge>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    <Link 
                      href={`/posts/${post.slug}`}
                      className="hover:text-green-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.meta?.description && (
                    <CardDescription className="line-clamp-3 text-sm">
                      {post.meta.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {post.publishedAt && (
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    {post.readingTime && (
                      <span>{post.readingTime}分読了</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 rounded-2xl p-8 mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">ゴルフを始める準備はできましたか？</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          これらの基礎記事を読んで、自信を持ってゴルフコースに向かいましょう。
          分からないことがあれば、いつでも基礎に戻って復習できます。
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            href="/categories/getting-started"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            はじめてのゴルフ
          </Link>
          <Link 
            href="/categories/basic-techniques"
            className="border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
          >
            基本テクニック
          </Link>
        </div>
      </div>
    </div>
  )
}