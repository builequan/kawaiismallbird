import type { RequiredDataFromCollectionSlug } from 'payload'

// Used for pre-seeded content so that the homepage is not empty
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: {
      root: {
        children: [
          {
            children: [
              {
                text: 'かわいい鳥の世界へようこそ',
                type: 'text',
              },
            ],
            type: 'heading',
            tag: 'h1',
            version: 1,
          },
          {
            children: [
              {
                text: '小さくてかわいい鳥たちの魅力的な世界を探索しましょう。',
                type: 'text',
              },
            ],
            type: 'paragraph',
            version: 1,
          },
        ],
        type: 'root',
        version: 1,
        indent: 0,
        direction: 'ltr',
        format: '',
      },
    },
  },
  meta: {
    description: '小さくてかわいい鳥たちの魅力的な世界を探索するブログサイト',
    title: 'ホーム - Kawaii Bird',
  },
  title: 'ホーム',
  layout: [
    {
      blockType: 'homepageLayout',
      blockName: 'homepage-content',
      showMostViewedPosts: true,
      mostViewedPostsLimit: 6,
      showRecentPosts: true,
      recentPostsLimit: 6,
      showCategories: true,
      categoriesLimit: 8,
      sectionOrder: 'categories-viewed-recent',
      id: 'content-01',
    },
  ],
}
