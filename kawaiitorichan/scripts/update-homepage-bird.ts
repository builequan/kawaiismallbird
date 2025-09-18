import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function updateHomepage() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Check if home page exists
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'home',
        },
      },
    })

    const homepageData = {
      slug: 'home',
      title: 'ホーム',
      _status: 'published' as const,
      hero: {
        type: 'lowImpact' as const,
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
        title: 'ホーム - Kawaii Bird',
        description: '小さくてかわいい鳥たちの魅力的な世界を探索するブログサイト',
      },
      layout: [
        {
          blockType: 'heroBlog',
          blockName: 'homepage-hero',
          title: '小さくてかわいい鳥の世界',
          subtitle: '美しい鳥たちの写真、生態、そして彼らとの素敵な暮らしについて紹介します。',
          ctaText: '記事を読む',
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

    if (existingPages.docs.length > 0) {
      // Update existing homepage
      await payload.update({
        collection: 'pages',
        id: existingPages.docs[0].id,
        data: homepageData,
      })
      console.log('✅ Homepage updated successfully with bird theme!')
    } else {
      // Create new homepage
      await payload.create({
        collection: 'pages',
        data: homepageData,
      })
      console.log('✅ Homepage created successfully with bird theme!')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to update homepage:', error)
    process.exit(1)
  }
}

updateHomepage()