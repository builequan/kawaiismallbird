import type { HomepageLayoutBlock as HomepageLayoutBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import { MostViewedPosts } from '@/components/PostGrid/MostViewedPosts'
import { RecentPosts } from '@/components/PostGrid/RecentPosts'
import { CategoryGrid } from '@/components/PostGrid/CategoryGrid'

type Props = {
  className?: string
} & HomepageLayoutBlockProps

export const HomepageLayoutBlock: React.FC<Props> = ({
  className,
  showMostViewedPosts = true,
  mostViewedPostsLimit = 6,
  showRecentPosts = true,
  recentPostsLimit = 6,
  showCategories = true,
  categoriesLimit = 8,
  sectionOrder = 'categories-viewed-recent',
}) => {
  const sections = {
    categories: showCategories && (
      <CategoryGrid
        key="categories"
        limit={categoriesLimit}
        className="bg-white"
      />
    ),
    mostViewed: showMostViewedPosts && (
      <MostViewedPosts
        key="mostViewed"
        limit={mostViewedPostsLimit}
        className="bg-gray-50"
      />
    ),
    recent: showRecentPosts && (
      <RecentPosts
        key="recent"
        limit={recentPostsLimit}
        className="bg-white"
      />
    ),
  }

  // Define section orders
  const sectionOrders = {
    'categories-viewed-recent': ['categories', 'mostViewed', 'recent'],
    'viewed-recent-categories': ['mostViewed', 'recent', 'categories'],
    'recent-viewed-categories': ['recent', 'mostViewed', 'categories'],
    'categories-recent-viewed': ['categories', 'recent', 'mostViewed'],
  }

  const orderedSections = sectionOrders[sectionOrder] || sectionOrders['categories-viewed-recent']

  return (
    <div className={cn('w-full', className)}>
      {orderedSections.map((sectionKey, index) => {
        const section = sections[sectionKey as keyof typeof sections]
        return section ? (
          <div key={`${sectionKey}-${index}`}>
            {section}
          </div>
        ) : null
      })}
    </div>
  )
}