import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Calendar, Clock, Eye } from 'lucide-react'
import Image from 'next/image'

// Force dynamic rendering to avoid build-time Payload initialization issues
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
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

  return {
    title: `${category.title} - Golf Category`,
    description: category.description || `Browse all ${category.title} golf articles and guides.`,
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

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })
  
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

  // Get posts in this category (and child categories if parent)
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        in: categoryIds,
      },
      _status: {
        equals: 'published',
      },
    },
    limit: 50,
    sort: '-publishedAt',
    depth: 2,
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Green Background */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 mb-6 text-sm">
            <Link href="/" className="hover:text-green-200 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-green-300" />
            <Link href="/categories" className="hover:text-green-200 transition-colors">
              Categories  
            </Link>
            {parentCategory && (
              <>
                <ChevronRight className="w-4 h-4 text-green-300" />
                <Link 
                  href={`/categories/${parentCategory.slug}`}
                  className="hover:text-green-200 transition-colors"
                >
                  {parentCategory.title}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-green-300" />
            <span className="font-semibold">{category.title}</span>
          </nav>

          {/* Category Header */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.title}</h1>
            {category.description && (
              <p className="text-lg opacity-90 max-w-3xl">{category.description}</p>
            )}
            <div className="flex items-center gap-4 mt-6">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Child Categories */}
        {childCategories.length > 0 && (
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
              >
                <Badge 
                  variant="outline" 
                  className="bg-white hover:bg-green-50 hover:border-green-600 transition-colors cursor-pointer text-gray-700"
                >
                  {child.title}
                </Badge>
              </Link>
            ))}
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

        {/* Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const heroImage = post.hero && typeof post.hero === 'object' && 'url' in post.hero 
            ? post.hero 
            : null
            
          return (
            <Card key={post.id} className="bg-white hover:shadow-lg transition-shadow overflow-hidden border-gray-200">
              {heroImage && (
                <div className="relative w-full h-48">
                  <Image
                    src={heroImage.url}
                    alt={heroImage.alt || post.title}
                    fill
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
                {post.meta?.description && (
                  <CardDescription className="line-clamp-3 mt-2">
                    {post.meta.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {post.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {post.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readingTime} min read</span>
                    </div>
                  )}
                  {post.views && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.views.toLocaleString()} views</span>
                    </div>
                  )}
                </div>
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.categories.slice(0, 2).map((cat) => {
                      const categoryData = typeof cat === 'object' ? cat : null
                      if (!categoryData) return null
                      
                      return (
                        <Badge 
                          key={categoryData.id} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {categoryData.title}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">
              No articles found in this category yet. Check back soon for new content!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}