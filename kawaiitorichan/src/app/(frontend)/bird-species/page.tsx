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
  title: '鳥の種類 - 世界の美しい鳥たち',
  description: '世界中の美しい鳥たち。ペットとして人気の種類から野鳥まで、多様な鳥の世界を探索しましょう。',
}

// Species categories with bird icons
const speciesCategories = [
  {
    slug: 'parrots',
    title: 'インコ・オウム類',
    icon: '🦜',
    image: '/birdicons/オカメインコ.webp',
    description: '色鮮やかで知能の高い鳥たち'
  },
  {
    slug: 'finches',
    title: 'フィンチ類',
    icon: '🐦',
    image: '/birdicons/フィンチ.webp',
    description: '美しい歌声の小鳥たち'
  },
  {
    slug: 'java-canary',
    title: '文鳥・カナリア',
    icon: '🎵',
    image: '/birdicons/文鳥.webp',
    description: '優雅で美しい鳥たち'
  },
  {
    slug: 'wild-birds',
    title: '野鳥の種類',
    icon: '🌿',
    image: '/birdicons/その他.webp',
    description: '自然に生きる鳥たち'
  },
  {
    slug: 'rare-species',
    title: '希少種・保護種',
    icon: '💎',
    image: '/birdicons/その他.webp',
    description: '守るべき貴重な鳥たち'
  }
]

export default async function BirdSpeciesPage() {
  const payload = await getPayload({ config })
  const categoryData = getCategoryBySlug('bird-species')

  // Get the bird-species category
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: 'bird-species',
      },
    },
    limit: 1,
  })

  const category = categories[0]

  if (!category) {
    // Static content if category doesn't exist
    return (
      <div className="min-h-screen bg-white">
        <div className={`bg-gradient-to-r ${categoryData?.color || 'from-purple-500 to-pink-600'} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 text-[300px]">🦜</div>
          </div>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">鳥の種類</h1>
            <p className="text-lg opacity-90 max-w-3xl">
              {categoryData?.description}
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">カテゴリーデータを準備中です。</p>
        </div>
      </div>
    )
  }

  // Get subcategories and posts
  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: {
      parent: {
        equals: category.id,
      },
    },
    limit: 20,
  })

  const categoryIds = [category.id, ...childCategories.map(c => c.id)]

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

  // Group posts by species type
  const postsBySpecies = speciesCategories.map(species => {
    const matchingCategory = childCategories.find(c =>
      c.title.includes(species.title) || c.slug.includes(species.slug)
    )

    if (!matchingCategory) {
      return { ...species, posts: [], categoryId: null }
    }

    const posts = allPosts.filter(post => {
      if (!post.categories || !Array.isArray(post.categories)) return false
      return post.categories.some(cat =>
        typeof cat === 'object' && cat.id === matchingCategory.id
      )
    })

    return {
      ...species,
      posts: posts.slice(0, 6),
      categoryId: matchingCategory.id,
      categorySlug: matchingCategory.slug
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section with Colorful Gradient */}
      <div className={`bg-gradient-to-r ${categoryData?.color || 'from-purple-500 to-pink-600'} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 text-[250px] animate-bounce">🦜</div>
          <div className="absolute bottom-10 left-10 text-[200px] animate-bounce delay-700">🐦</div>
          <div className="absolute top-1/2 left-1/2 text-[180px] animate-bounce delay-500">🦅</div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="hover:text-purple-200 transition-colors">
              ホーム
            </Link>
            <ChevronRight className="w-4 h-4 text-purple-300" />
            <span className="font-semibold">鳥の種類</span>
          </nav>

          {/* Hero Content */}
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              鳥の種類
            </h1>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              {categoryData?.description}
            </p>
            <div className="flex justify-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-3">
                {allPosts.length}件の記事
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-3">
                {speciesCategories.length}種類のカテゴリー
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Species Category Cards */}
      <div className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {speciesCategories.map((species) => (
            <div
              key={species.slug}
              className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all text-center group cursor-pointer"
            >
              <div className="relative w-24 h-24 mx-auto mb-4">
                <Image
                  src={species.image}
                  alt={species.title}
                  fill
                  className="object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">
                {species.title}
              </h3>
              <p className="text-xs text-gray-600">
                {species.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-16">
        {/* Species Sections with Posts */}
        {postsBySpecies.map((section, index) => {
          if (section.posts.length === 0) return null

          const isEven = index % 2 === 0

          return (
            <div key={section.slug} className="mb-20">
              {/* Section Header with Alternating Layout */}
              <div className={`flex items-center gap-8 mb-10 ${isEven ? '' : 'flex-row-reverse'}`}>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {section.description}
                  </p>
                  {section.categorySlug && (
                    <Link
                      href={`/categories/${section.categorySlug}`}
                      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      すべての記事を見る
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Posts Grid */}
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
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
                                return `/media/${node.value.filename}`
                              }
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

                  // Use a default image if none found
                  if (!heroImageUrl) {
                    heroImageUrl = '/birdimage/download.webp'
                  }

                  return (
                    <Card key={post.id} className="bg-white hover:shadow-xl transition-all group overflow-hidden">
                      <Link href={`/posts/${post.slug}`}>
                        <div className="relative w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                          {heroImageUrl ? (
                            <Image
                              src={heroImageUrl}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl opacity-50">{section.icon}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm line-clamp-2 min-h-[2.5rem]">
                          <Link
                            href={`/posts/${post.slug}`}
                            className="hover:text-purple-600 transition-colors text-gray-900"
                          >
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Featured Bird Species Gallery */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            人気のペット鳥たち
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { name: 'セキセイインコ', icon: '/birdicons/セキセイインコ.webp', href: '/birds/budgerigar' },
              { name: 'オカメインコ', icon: '/birdicons/オカメインコ.webp', href: '/birds/cockatiel' },
              { name: '文鳥', icon: '/birdicons/文鳥.webp', href: '/birds/java-sparrow' },
              { name: 'カナリア', icon: '/birdicons/カナリア.webp', href: '/birds/canary' },
              { name: 'コザクラインコ', icon: '/birdicons/コザクラインコ.webp', href: '/birds/lovebird' },
              { name: 'フィンチ', icon: '/birdicons/フィンチ.webp', href: '/birds/finch' },
              { name: 'その他', icon: '/birdicons/その他.webp', href: '/birds/others' },
              { name: 'すべて', icon: '📚', href: '/birds/all' }
            ].map((bird) => (
              <Link
                key={bird.name}
                href={bird.href}
                className="group text-center"
              >
                <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1">
                  {bird.icon === '📚' ? (
                    <div className="text-5xl mb-2">{bird.icon}</div>
                  ) : (
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <Image
                        src={bird.icon}
                        alt={bird.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                    {bird.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            鳥たちの素晴らしい多様性を発見しよう
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            地球上には約10,000種類の鳥が生息しています。
            その美しさ、知性、そして生態の不思議を一緒に探求しましょう。
          </p>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
          >
            他のカテゴリーを探索
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}