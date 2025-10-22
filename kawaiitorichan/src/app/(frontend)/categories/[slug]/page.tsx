import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { getCategoryBySlug } from '@/data/categoryData'
import { StructuredData } from '@/components/StructuredData'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Pagination } from '@/components/Pagination'
import { generateBreadcrumbSchema, generateCategoryBreadcrumbs, generateCollectionPageSchema } from '@/utilities/generateStructuredData'
import { getServerSideURL } from '@/utilities/getURL'

// Skip pre-rendering during build, but cache at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

interface PageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parseInt(pageParam || '1', 10)
  const payload = await getPayload({ config })
  
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  const category = categories[0]
  
  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  const serverUrl = getServerSideURL()
  const baseUrl = `${serverUrl}/categories/${slug}`
  const canonicalUrl = currentPage > 1 ? `${baseUrl}?page=${currentPage}` : baseUrl
  const title = currentPage > 1
    ? `${category.title} (ページ ${currentPage}) - かわいい小鳥 | Kawaii Small Bird`
    : `${category.title} - かわいい小鳥 | Kawaii Small Bird`

  // Build pagination links
  const links: { rel: string; url: string }[] = []
  if (currentPage > 1) {
    links.push({ rel: 'prev', url: currentPage === 2 ? baseUrl : `${baseUrl}?page=${currentPage - 1}` })
  }
  // We'll add 'next' link if there are more pages (determined in the component)

  return {
    title,
    description: category.description || `${category.title}に関する小鳥の飼育ガイドと情報をご覧ください。`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ja-JP': canonicalUrl,
        'ja': canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    other: {
      ...(links.length > 0 && links.reduce((acc, link) => ({
        ...acc,
        [link.rel]: link.url
      }), {}))
    },
    openGraph: {
      title: `${category.title} - かわいい小鳥`,
      description: category.description || `${category.title}に関する小鳥の飼育ガイドと情報`,
      url: canonicalUrl,
      type: 'website',
      locale: 'ja_JP',
      siteName: 'Kawaii Small Bird',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.title} - かわいい小鳥`,
      description: category.description || `${category.title}に関する小鳥の飼育ガイド`,
    },
  }
}

// Completely disable static generation for Docker builds
// export async function generateStaticParams() {
//   // Skip static generation during build if no database connection
//   if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
//     return []
//   }

//   try {
//     const payload = await getPayload({ config })
//     const { docs: categories } = await payload.find({
//       collection: 'categories',
//       limit: 100,
//     })

//     return categories.map((category) => ({
//       slug: category.slug,
//     }))
//   } catch (error) {
//     console.warn('Failed to generate static params for categories:', error)
//     return []
//   }
// }

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parseInt(pageParam || '1', 10)
  const postsPerPage = 12
  const payload = await getPayload({ config })

  // Get category display data
  const categoryDisplayData = getCategoryBySlug(slug)

  // Get the category
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  const category = categories[0]

  if (!category) {
    notFound()
  }

  // Get child categories if this is a parent category
  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: {
      parent: {
        equals: category.id,
      },
    },
    limit: 20,
  })

  // Get all category IDs to query (include children for parent categories)
  const categoryIds = [category.id, ...childCategories.map(c => c.id)]

  // Get posts in this category (and child categories if parent) with pagination
  const { docs: posts, totalDocs, totalPages, page } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        in: categoryIds,
      },
      _status: {
        equals: 'published',
      },
    },
    limit: postsPerPage,
    page: currentPage,
    sort: '-publishedAt',
    depth: 3,
  })

  // Get parent category if this is a child
  let parentCategory = null
  if (category.parent && typeof category.parent === 'object') {
    parentCategory = category.parent
  }

  // Get sibling categories if this is a child category
  let siblingCategories: any[] = []
  if (parentCategory) {
    const { docs: siblings } = await payload.find({
      collection: 'categories',
      where: {
        and: [
          {
            parent: {
              equals: parentCategory.id,
            },
          },
          {
            id: {
              not_equals: category.id,
            },
          },
        ],
      },
      limit: 10,
    })
    siblingCategories = siblings
  }

  // Get other categories for internal linking
  const { docs: otherCategories } = await payload.find({
    collection: 'categories',
    where: {
      id: {
        not_equals: category.id,
      },
    },
    limit: 6,
    sort: 'order',
  })

  // Group posts by subcategory
  const postsBySubcategory = childCategories.map(subcat => {
    const subcatPosts = posts.filter(post => {
      if (!post.categories || !Array.isArray(post.categories)) return false
      return post.categories.some(cat =>
        typeof cat === 'object' && cat.id === subcat.id
      )
    })
    return {
      category: subcat,
      posts: subcatPosts
    }
  }).filter(group => group.posts.length > 0)

  // Posts directly in parent category (not in any subcategory)
  const directPosts = posts.filter(post => {
    if (!post.categories || !Array.isArray(post.categories)) return false
    const postCategoryIds = post.categories
      .filter(cat => typeof cat === 'object')
      .map(cat => cat.id)

    // Check if post is in parent but not in any child
    const inParent = postCategoryIds.includes(category.id)
    const inChild = childCategories.some(child => postCategoryIds.includes(child.id))
    return inParent && !inChild
  })

  // Generate structured data for SEO
  const breadcrumbItems = generateCategoryBreadcrumbs(category, parentCategory)
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems)
  const collectionPageSchema = generateCollectionPageSchema(category, posts, breadcrumbSchema)

  return (
    <div className="min-h-screen bg-white">
      {/* SEO: JSON-LD Structured Data */}
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={collectionPageSchema} />
      {/* Hero Section with Category-specific Styling */}
      <div className={categoryDisplayData ? `bg-gradient-to-r ${categoryDisplayData.color} text-white relative overflow-hidden` : "bg-gradient-to-r from-green-600 to-green-700 text-white"}>
        {categoryDisplayData && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 text-[200px]">{categoryDisplayData.icon}</div>
          </div>
        )}
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* SEO: Breadcrumb Navigation */}
          <Breadcrumbs items={breadcrumbItems} className="mb-6 text-white [&_a]:text-white [&_a:hover]:text-green-200 [&_span]:text-white" />

          {/* Category Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.title}</h1>
            {categoryDisplayData ? (
              <p className="text-lg opacity-90 max-w-3xl">{categoryDisplayData.description}</p>
            ) : (
              category.description && (
                <p className="text-lg opacity-90 max-w-3xl">{category.description}</p>
              )
            )}
            <div className="flex items-center gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {totalDocs} {totalDocs === 1 ? '記事' : '記事'}
              </Badge>
              {childCategories.length > 0 && (
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {childCategories.length} サブカテゴリー
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Featured Subcategories Grid */}
        {childCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">サブカテゴリー</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {childCategories.map((child) => {
                const childPostCount = posts.filter(post => {
                  if (!post.categories || !Array.isArray(post.categories)) return false
                  return post.categories.some(cat =>
                    typeof cat === 'object' && cat.id === child.id
                  )
                }).length

                return (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-lg transition-all text-center group"
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {child.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {childPostCount}件の記事
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Sibling Categories */}
        {siblingCategories.length > 0 && (
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Related Categories</h2>
          <div className="flex flex-wrap gap-2">
            {siblingCategories.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/categories/${sibling.slug}`}
              >
                <Badge 
                  variant="outline" 
                  className="bg-white hover:bg-green-50 hover:border-green-600 transition-colors cursor-pointer text-gray-700"
                >
                  {sibling.title}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

        {/* Posts by Subcategory */}
        {postsBySubcategory.map((group) => (
          <div key={group.category.id} className="mb-12">
            <div className="flex items-center justify-between mb-6 border-b-2 border-gray-200 pb-2">
              <h2 className="text-xl font-bold text-gray-900">{group.category.title}</h2>
              <Link
                href={`/categories/${group.category.slug}`}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {group.posts.slice(0, 4).map((post) => {
                // Extract hero image - check heroImage field first
                let heroImageUrl: string | null = null

                if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
                  heroImageUrl = post.heroImage.url
                }

                // Apply URL fix if we have an image
                if (heroImageUrl && heroImageUrl.includes('/api/media/file/')) {
                  heroImageUrl = heroImageUrl.replace('/api/media/file/', '/media/')
                }

                return (
                  <Card key={post.id} className="bg-white hover:shadow-lg transition-shadow overflow-hidden border-gray-200">
                    {heroImageUrl && (
                      <div className="relative w-full h-40">
                        <Image
                          src={heroImageUrl}
                          alt={post.title}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-2 min-h-[3rem] text-gray-900">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="hover:text-green-600 transition-colors"
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
        ))}

        {/* Direct Posts (not in subcategories) */}
        {directPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b-2 border-gray-200 pb-2">
              その他の記事
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {directPosts.map((post) => {
          // Extract hero image - check heroImage field first
          let heroImageUrl: string | null = null

          if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
            heroImageUrl = post.heroImage.url
          }

          // Apply URL fix if we have an image
          if (heroImageUrl && heroImageUrl.includes('/api/media/file/')) {
            heroImageUrl = heroImageUrl.replace('/api/media/file/', '/media/')
          }

          return (
            <Card key={post.id} className="bg-white hover:shadow-lg transition-shadow overflow-hidden border-gray-200">
              {heroImageUrl && (
                <div className="relative w-full h-48">
                  <Image
                    src={heroImageUrl}
                    alt={post.title}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl line-clamp-2 text-gray-900">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="hover:text-green-600 transition-colors text-gray-900"
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
      )}

        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">
              このカテゴリーにはまだ記事がありません。新しいコンテンツをお楽しみに！
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/categories/${slug}`}
          />
        )}

        {/* Related Categories Section for Internal Linking */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">その他のカテゴリー</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cat.title}</h3>
                {cat.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}