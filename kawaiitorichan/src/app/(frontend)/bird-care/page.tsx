import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Calendar, Eye, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { getCategoryBySlug } from '@/data/categoryData'
import { fixMediaUrl } from '@/utilities/fixMediaUrl'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '鳥の飼い方 - 愛鳥との幸せな生活ガイド',
  description: '愛鳥との幸せな生活のための飼育方法、日常のお世話、環境づくりのコツをご紹介します。初心者から上級者まで役立つ情報満載。',
}

// Define subcategory structure for bird-care
const subcategories = [
  {
    slug: 'feeding',
    title: '栄養・餌やり',
    icon: '🍎',
    description: '健康的な食事管理'
  },
  {
    slug: 'cage-setup',
    title: '飼育環境・ケージ設定',
    icon: '🏠',
    description: '快適な生活空間づくり'
  },
  {
    slug: 'health-care',
    title: '健康・獣医ケア',
    icon: '💊',
    description: '病気予防と健康管理'
  },
  {
    slug: 'behavior-training',
    title: '行動・トレーニング',
    icon: '🎯',
    description: 'しつけと遊び方'
  },
  {
    slug: 'legal-ethics',
    title: '法律・倫理・飼育の考慮',
    icon: '⚖️',
    description: '責任ある飼育のために'
  }
]

export default async function BirdCarePage() {
  const payload = await getPayload({ config })
  const categoryData = getCategoryBySlug('bird-care')

  // Get the bird-care category
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: 'bird-care',
      },
    },
    limit: 1,
  })

  const category = categories[0]

  if (!category) {
    // If category doesn't exist in DB, show static content
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className={`bg-gradient-to-r ${categoryData?.color || 'from-green-500 to-emerald-600'} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 text-[300px]">🏠</div>
          </div>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <nav className="flex items-center gap-2 mb-6 text-sm">
              <Link href="/" className="hover:text-green-200 transition-colors">
                ホーム
              </Link>
              <ChevronRight className="w-4 h-4 text-green-300" />
              <span className="font-semibold">鳥の飼い方</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">鳥の飼い方</h1>
            <p className="text-lg opacity-90 max-w-3xl">
              {categoryData?.description || '愛鳥との幸せな生活のための飼育方法、日常のお世話、環境づくりのコツをご紹介します。'}
            </p>
          </div>
        </div>

        {/* Content sections would go here */}
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">カテゴリーデータを準備中です。</p>
        </div>
      </div>
    )
  }

  // Get all posts in this category and its subcategories
  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: {
      parent: {
        equals: category.id,
      },
    },
    limit: 20,
  })

  // Get all category IDs
  const categoryIds = [category.id, ...childCategories.map(c => c.id)]

  // Get posts
  const { docs: allPosts } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        in: categoryIds,
      },
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    sort: '-publishedAt',
    depth: 3,
  })

  // Group posts by subcategory
  const postsBySubcategory = subcategories.map(subcat => {
    const matchingCategory = childCategories.find(c =>
      c.title.includes(subcat.title) || c.slug.includes(subcat.slug)
    )

    // If no matching subcategory, use posts from main category
    if (!matchingCategory) {
      // Take some posts from the main category for this section
      const startIdx = subcategories.indexOf(subcat) * 4
      const sectionPosts = allPosts.slice(startIdx, startIdx + 4)
      return { ...subcat, posts: sectionPosts, categoryId: null }
    }

    const posts = allPosts.filter(post => {
      if (!post.categories || !Array.isArray(post.categories)) return false
      return post.categories.some(cat =>
        typeof cat === 'object' && cat.id === matchingCategory.id
      )
    })

    return {
      ...subcat,
      posts: posts.slice(0, 4),
      categoryId: matchingCategory.id,
      categorySlug: matchingCategory.slug
    }
  })

  // Get popular posts
  const popularPosts = allPosts
    .filter(post => post.views && post.views > 0)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6)

  // Get recent posts
  const recentPosts = allPosts.slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Beautiful Gradient */}
      <div className={`bg-gradient-to-r ${categoryData?.color || 'from-green-500 to-emerald-600'} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-[300px] animate-pulse">🏠</div>
          <div className="absolute bottom-10 left-10 text-[200px] animate-pulse delay-300">🐦</div>
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="hover:text-green-200 transition-colors">
              ホーム
            </Link>
            <ChevronRight className="w-4 h-4 text-green-300" />
            <span className="font-semibold">鳥の飼い方</span>
          </nav>

          {/* Hero Content */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                鳥の飼い方
              </h1>
              <p className="text-xl opacity-90 mb-8">
                {categoryData?.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                  {allPosts.length}件の記事
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                  {childCategories.length}個のサブカテゴリー
                </Badge>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {categoryData?.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl mb-2">✓</div>
                  <p className="text-sm">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {subcategories.map((subcat) => (
            <div
              key={subcat.slug}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center cursor-pointer group"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {subcat.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">
                {subcat.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {subcat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12">
        {/* Subcategory Sections */}
        {postsBySubcategory.map((section) => {
          if (section.posts.length === 0) return null

          return (
            <div key={section.slug} className="mb-16">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{section.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 text-sm">{section.description}</p>
                  </div>
                </div>
                {section.categorySlug && (
                  <Link
                    href={`/categories/${section.categorySlug}`}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    すべて見る
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Posts Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {section.posts.map((post) => {
                  // Extract hero image from various sources
                  let heroImageUrl: string | null = null

                  if (post.hero && typeof post.hero === 'object' && 'url' in post.hero) {
                    heroImageUrl = fixMediaUrl(post.hero.url)
                  } else if (post.content) {
                    // Try to extract first image from content
                    try {
                      if (typeof post.content === 'object' && post.content.root) {
                        const findFirstImage = (node: any): string | null => {
                          if (node.type === 'upload' && node.value) {
                            // Handle different value structures
                            if (typeof node.value === 'object') {
                              if ('url' in node.value) {
                                return node.value.url
                              } else if ('filename' in node.value) {
                                // Construct URL from filename
                                return `/files/${node.value.filename}`
                              }
                            } else if (typeof node.value === 'string') {
                              // If it's a string ID, we can't use it directly
                              return null
                            } else if (typeof node.value === 'number') {
                              // If it's a numeric ID, we need the populated data
                              // This won't work without the full media object
                              return null
                            }
                          }
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
                          heroImageUrl = fixMediaUrl(firstImage)
                        }
                      }
                    } catch (e) {
                      console.error('Error extracting image:', e)
                    }
                  }

                  // Fallback to default bird image if no image found
                  if (!heroImageUrl) {
                    heroImageUrl = '/birdimage/download.webp'
                  }

                  return (
                    <Card key={post.id} className="bg-white hover:shadow-xl transition-all border-gray-200 group">
                      <Link href={`/posts/${post.slug}`}>
                        <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                          {heroImageUrl ? (
                            <Image
                              src={heroImageUrl}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-6xl opacity-50">{section.icon}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardHeader>
                        <CardTitle className="text-base line-clamp-2 min-h-[3rem]">
                          <Link
                            href={`/posts/${post.slug}`}
                            className="hover:text-green-600 transition-colors text-gray-900"
                          >
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {post.publishedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(post.publishedAt).toLocaleDateString('ja-JP', {
                                  month: 'numeric',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                          {post.views && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{post.views.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Popular & Recent Posts Section */}
        <div className="grid lg:grid-cols-2 gap-12 mt-16">
          {/* Popular Posts */}
          {popularPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">🔥</span>
                人気の記事
              </h2>
              <div className="space-y-4">
                {popularPosts.slice(0, 5).map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    className="flex items-start gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
                  >
                    <span className="text-2xl font-bold text-gray-300">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span>{post.views?.toLocaleString()} views</span>
                        {post.publishedAt && (
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            愛鳥との素敵な生活を始めましょう
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            正しい知識と愛情があれば、鳥たちとの生活はとても豊かなものになります。
            一緒に学んで、愛鳥との絆を深めていきましょう。
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
          >
            他のカテゴリーを見る
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}