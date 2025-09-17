import type { RequiredDataFromCollectionSlug } from 'payload'

// Used for pre-seeded content so that the homepage is not empty
export const homeStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'home',
  _status: 'published',
  hero: {
    type: 'none',
  },
  meta: {
    description: 'ゴルフの上達に役立つ技術、知識、最新情報を提供する日本語ゴルフブログサイト',
    title: 'ホーム - ゴルフライフをサポート',
  },
  title: 'ホーム',
  layout: [
    {
      blockType: 'heroBlog',
      blockName: 'homepage-hero',
      title: 'あなたのゴルフライフをサポート',
      subtitle: 'ゴルフの上達に必要な技術、知識、そして最新の情報をお届けします。スコアアップを目指して、一緒に学びましょう。',
      ctaText: 'ゴルフ記事を見る',
      ctaLink: '/posts',
      gradientStyle: 'pinkPurple',
      layout: 'center',
      id: 'hero-01',
    },
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
