import type { Block } from 'payload'

export const HomepageLayout: Block = {
  slug: 'homepageLayout',
  fields: [
    {
      name: 'showMostViewedPosts',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the most viewed posts section',
      },
    },
    {
      name: 'mostViewedPostsLimit',
      type: 'number',
      defaultValue: 6,
      min: 3,
      max: 12,
      admin: {
        condition: (data) => data.showMostViewedPosts,
        description: 'Number of most viewed posts to display',
      },
    },
    {
      name: 'showRecentPosts',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the recent posts section',
      },
    },
    {
      name: 'recentPostsLimit',
      type: 'number',
      defaultValue: 6,
      min: 3,
      max: 12,
      admin: {
        condition: (data) => data.showRecentPosts,
        description: 'Number of recent posts to display',
      },
    },
    {
      name: 'showCategories',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the categories section',
      },
    },
    {
      name: 'categoriesLimit',
      type: 'number',
      defaultValue: 8,
      min: 4,
      max: 12,
      admin: {
        condition: (data) => data.showCategories,
        description: 'Number of categories to display',
      },
    },
    {
      name: 'sectionOrder',
      type: 'select',
      defaultValue: 'categories-viewed-recent',
      options: [
        { label: 'Categories → Most Viewed → Recent', value: 'categories-viewed-recent' },
        { label: 'Most Viewed → Recent → Categories', value: 'viewed-recent-categories' },
        { label: 'Recent → Most Viewed → Categories', value: 'recent-viewed-categories' },
        { label: 'Categories → Recent → Most Viewed', value: 'categories-recent-viewed' },
      ],
      admin: {
        description: 'Order of sections on the homepage',
      },
    },
  ],
  interfaceName: 'HomepageLayoutBlock',
}