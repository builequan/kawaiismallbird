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

    // Get subcategories for each parent
    const categoriesWithChildren = await Promise.all(
      parentCategories.map(async (category) => {
        const { docs: children } = await payload.find({
          collection: 'categories',
          limit: 20,
          where: {
            parent: { equals: category.id }
          },
          sort: 'createdAt'
        })

        return {
          label: `${getCategoryIcon(category.title)} ${category.title}`,
          href: `/categories/${category.slug}`,
          submenu: children.map(child => ({
            label: child.title,
            href: `/categories/${child.slug}`
          }))
        }
      })
    )

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