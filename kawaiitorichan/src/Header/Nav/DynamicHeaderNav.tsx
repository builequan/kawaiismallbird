import React from 'react'
import { getCachedPayload } from '@/lib/payload-singleton'
import { HeaderNav } from './index'
import type { Header as HeaderType } from '@/payload-types'

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

export async function DynamicHeaderNav({ data }: { data: HeaderType }) {
  try {
    const payload = await getCachedPayload()

    // Get parent categories (main categories)
    const { docs: parentCategories } = await payload.find({
      collection: 'categories',
      limit: 10,
      where: {
        parent: { exists: false }
      },
      sort: 'createdAt'
    })

    // Get subcategories for each parent and count posts
    const categoriesWithChildren = await Promise.all(
      parentCategories.map(async (category) => {
        // Get subcategories
        const { docs: children } = await payload.find({
          collection: 'categories',
          limit: 50,
          where: {
            parent: { equals: category.id }
          },
          sort: 'createdAt'
        })

        // Filter children that have posts
        const childrenWithPosts = await Promise.all(
          children.map(async (child) => {
            const { totalDocs } = await payload.find({
              collection: 'posts',
              limit: 1,
              where: {
                categories: { equals: child.id }
              }
            })

            return totalDocs > 0 ? {
              label: child.title,
              href: `/categories/${child.slug}`,
              postCount: totalDocs
            } : null
          })
        ).then(items => items.filter(Boolean))

        // Count posts for parent category (including all children)
        const { totalDocs: parentPostCount } = await payload.find({
          collection: 'posts',
          limit: 1,
          where: {
            categories: { equals: category.id }
          }
        })

        // Only return category if it has posts (either direct or in children)
        if (parentPostCount > 0 || childrenWithPosts.length > 0) {
          return {
            label: `${getCategoryIcon(category.title)} ${category.title}`,
            href: `/categories/${category.slug}`,
            submenu: childrenWithPosts,
            postCount: parentPostCount
          }
        }

        return null
      })
    )

    // Filter out null categories (those with no posts)
    const filteredCategories = categoriesWithChildren.filter(Boolean)

    // Create the enhanced data with dynamic categories
    const enhancedData: HeaderType = {
      ...data,
      dynamicCategories: filteredCategories
    }

    return <HeaderNav data={enhancedData} />
  } catch (error) {
    console.error('Error fetching categories for navigation:', error)
    // Fallback to original navigation without dynamic categories
    return <HeaderNav data={data} />
  }
}