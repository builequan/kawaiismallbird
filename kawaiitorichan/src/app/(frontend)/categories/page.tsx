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

export const metadata: Metadata = {
  title: 'Bird Categories - Browse All Topics',
  description: 'Explore our comprehensive bird content organized by category. From species identification to birdwatching tips, find all the bird information you need.',
}

async function getCategoriesWithPostCount() {
  const payload = await getPayload({ config })
  
  // Get all categories
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'order',
  })

  // Get posts count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: {
          categories: {
            equals: category.id,
          },
        },
      })
      
      return {
        ...category,
        postCount: totalDocs,
      }
    })
  )

  // Organize into parent-child structure
  const parentCategories = categoriesWithCount.filter(cat => !cat.parent)
  const childCategories = categoriesWithCount.filter(cat => cat.parent)

  const organizedCategories = parentCategories.map(parent => ({
    ...parent,
    children: childCategories.filter(child => 
      typeof child.parent === 'object' && child.parent?.id === parent.id
    ),
  }))

  return organizedCategories
}

export default async function CategoriesPage() {
  const categories = await getCategoriesWithPostCount()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Sky Blue Background */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">カテゴリー</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            かわいい鳥たちの世界へようこそ
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="bg-white hover:shadow-lg transition-shadow border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                <Link 
                  href={`/categories/${category.slug}`}
                  className="hover:text-green-600 transition-colors text-gray-900"
                >
                  {category.title}
                </Link>
              </CardTitle>
              {category.description && (
                <CardDescription className="mt-2">
                  {category.description}
                </CardDescription>
              )}
              {category.postCount > 0 && (
                <Badge variant="secondary" className="mt-2 w-fit">
                  {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                </Badge>
              )}
            </CardHeader>
            {category.children && category.children.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Subcategories:</p>
                  <div className="flex flex-wrap gap-2">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="inline-flex items-center gap-1"
                      >
                        <Badge 
                          variant="outline" 
                          className="bg-white hover:bg-green-50 hover:border-green-600 transition-colors cursor-pointer text-gray-700"
                        >
                          {child.title}
                          {child.postCount > 0 && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({child.postCount})
                            </span>
                          )}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

        {categories.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-600">
              No categories found. Run the setup script to create the initial category structure.
            </p>
            <code className="block mt-4 bg-white p-2 rounded text-sm text-gray-800">
              pnpm tsx scripts/setup-categories.ts
            </code>
          </div>
        )}
      </div>
    </div>
  )
}