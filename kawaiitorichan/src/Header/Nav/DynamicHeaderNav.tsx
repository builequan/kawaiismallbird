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

    // Whitelist: Only show these 6 categories
    const allowedCategories = [
      '餌と栄養',
      '野鳥観察',
      '鳥の生態',
      '鳥の健康',
      '鳥の飼い方',
      '鳥の種類'
    ]

    // Get parent categories (main categories)
    const { docs: parentCategories } = await payload.find({
      collection: 'categories',
      limit: 100,
      where: {
        parent: { exists: false },
        title: { in: allowedCategories } // Only get the 6 allowed categories
      },
      sort: '-createdAt'
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

        // Return category with its children (these are whitelisted, so we know they're valid)
        return {
          label: `${getCategoryIcon(category.title)} ${category.title}`,
          href: `/categories/${category.slug}`,
          submenu: childrenWithPosts
        }
      })
    )

    // All categories are already whitelisted, no need to filter
    console.log('🔍 DynamicHeaderNav: Showing whitelisted categories:', categoriesWithChildren.map(c => c.label).join(', '))

    // Create the enhanced data with dynamic categories
    const enhancedData: HeaderType = {
      ...data,
      dynamicCategories: categoriesWithChildren
    }

    return <HeaderNav data={enhancedData} />
  } catch (error) {
    console.error('Error fetching categories for navigation:', error)
    // Fallback to original navigation without dynamic categories
    return <HeaderNav data={data} />
  }
}