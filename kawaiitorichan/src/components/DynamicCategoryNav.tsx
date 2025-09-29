import React from 'react'
import { getCachedPayload } from '@/lib/payload-singleton'
import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'

// Generate category icons based on title
function getCategoryIcon(title: string): string {
  if (title.includes('種類')) return '🦜'
  if (title.includes('飼い方')) return '🏠'
  if (title.includes('健康')) return '💊'
  if (title.includes('生態')) return '🌿'
  if (title.includes('野鳥観察')) return '🔭'
  if (title.includes('餌') || title.includes('栄養')) return '🥗'
  return '📋'
}

export async function DynamicCategoryNav() {
  try {
    const payload = await getCachedPayload()

    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 100,
      depth: 2,
      where: {
        parent: { exists: false }  // Get only parent categories
      },
      sort: 'createdAt'
    })

    if (!categories.length) {
      return null
    }

    // Get subcategories for each parent
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        const { docs: children } = await payload.find({
          collection: 'categories',
          limit: 20,
          where: {
            parent: { equals: category.id }
          },
          sort: 'createdAt'
        })

        return {
          ...category,
          children
        }
      })
    )

    return (
      <div className="relative group">
        {/* Category dropdown items for desktop */}
        <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-3 z-50">
          {categoriesWithChildren.map((category) => (
            <div
              key={category.id}
              className="relative group/submenu"
            >
              {category.children.length > 0 ? (
                <>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium rounded-md mx-2"
                  >
                    <span>{getCategoryIcon(category.title)} {category.title}</span>
                    <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                  </Link>

                  {/* Nested Submenu */}
                  <div className="hidden group-hover/submenu:block absolute left-full top-0 ml-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-3">
                    {category.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="block px-4 py-2.5 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium text-sm rounded-md mx-2"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={`/categories/${category.slug}`}
                  className="block px-4 py-3 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium rounded-md mx-2"
                >
                  {getCategoryIcon(category.title)} {category.title}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching categories for navigation:', error)
    return null
  }
}