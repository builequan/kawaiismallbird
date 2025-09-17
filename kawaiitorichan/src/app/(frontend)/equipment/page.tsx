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
import { ChevronRight, Zap, ShoppingBag, Star, Wrench, Smartphone } from 'lucide-react'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import Image from 'next/image'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '用具・ギア - 最適なゴルフ用品を見つけよう',
  description: 'ゴルフクラブ、ボール、アクセサリー、最新ギアのレビューとガイド。初心者から上級者まで、あなたに最適な用具選びをサポートします。',
}

async function getCategoryData() {
  const payload = await getPayload({ config })
  
  // Get equipment category and its children
  const { docs: equipmentCategories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: 'equipment',
      },
    },
    limit: 1,
  })

  const equipmentCategory = equipmentCategories[0]
  
  if (!equipmentCategory) {
    return { category: null, childCategories: [], posts: [] }
  }

  // Get child categories
  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: {
      parent: {
        equals: equipmentCategory.id,
      },
    },
    limit: 10,
    sort: 'title',
  })

  // Get all category IDs to query posts
  const categoryIds = [equipmentCategory.id, ...childCategories.map(c => c.id)]

  // Get recent posts in equipment categories
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
    category: equipmentCategory,
    childCategories,
    posts,
  }
}

export default async function EquipmentPage() {
  const { category, childCategories, posts } = await getCategoryData()

  if (!category) {
    return <div>カテゴリーが見つかりません</div>
  }

  // Icons for each subcategory
  const categoryIcons = {
    'clubs': <Zap className="w-8 h-8 text-yellow-600" />,
    'balls-accessories': <ShoppingBag className="w-8 h-8 text-pink-600" />,
    'gear-reviews': <Star className="w-8 h-8 text-red-600" />,
    'equipment-guides': <Wrench className="w-8 h-8 text-blue-600" />,
    'technology-innovation': <Smartphone className="w-8 h-8 text-purple-600" />,
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
        <span className="font-semibold text-gray-900">用具・ギア</span>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            ⚡ 用具・ギア
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            あなのゴルフを次のレベルに押し上げる最適な用具を見つけましょう。
            クラブ選びからアクセサリー、最新テクノロジーまで、専門的なレビューとガイドでサポートします。
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>🛍️ {posts.length}記事</span>
            <span>⭐ 詳細レビュー</span>
            <span>🎯 購入ガイド</span>
            <span>💡 最新技術</span>
          </div>
        </div>
      </div>

      {/* Child Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">用具カテゴリー</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {childCategories.map((child) => {
            const iconKey = child.slug as keyof typeof categoryIcons
            const icon = categoryIcons[iconKey] || <ShoppingBag className="w-8 h-8 text-gray-600" />
            
            return (
              <Link key={child.id} href={`/categories/${child.slug}`}>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      {icon}
                    </div>
                    <CardTitle className="text-base">{child.title}</CardTitle>
                    {child.description && (
                      <CardDescription className="text-xs">
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

      {/* Featured Categories */}
      <div className="grid gap-6 md:grid-cols-2 mb-12">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              クラブ選びガイド
            </CardTitle>
            <CardDescription>
              ドライバーからパターまで、あなたに最適なクラブを見つけるための詳細ガイド
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/categories/clubs"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              クラブガイドを見る <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-red-600" />
              用具レビュー
            </CardTitle>
            <CardDescription>
              実際に使用した詳細なレビューで、購入前に製品を比較検討
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href="/categories/gear-reviews"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              レビューを見る <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新記事</h2>
          <Link 
            href="/categories/equipment" 
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
                      <Badge className="bg-orange-600 text-white">
                        用具・ギア
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
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 mt-12 text-center">
        <h3 className="text-2xl font-bold mb-4">最適な用具でゴルフをもっと楽しく</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          正しい用具選びは、ゴルフ上達の重要な要素です。
          私たちの詳細なレビューとガイドで、あなたに最適な一品を見つけてください。
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            href="/categories/clubs"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            クラブを探す
          </Link>
          <Link 
            href="/categories/gear-reviews"
            className="border border-orange-600 text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
          >
            レビューを読む
          </Link>
        </div>
      </div>
    </div>
  )
}