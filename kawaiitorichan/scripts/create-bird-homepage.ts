import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function createBirdHomepage() {
  const payload = await getPayload({ config: configPromise })

  try {
    // Check if home page exists
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'home',
        },
      },
    })

    const homePageData = {
      title: 'Kawaii Small Birds - かわいい小鳥たちの世界',
      slug: 'home',
      hero: {
        type: 'lowImpact',
        richText: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'かわいい小鳥たちの世界へようこそ',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                tag: 'h1',
              },
              {
                type: 'paragraph',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'Welcome to the World of Kawaii Small Birds',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
              },
              {
                type: 'paragraph',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: '美しい野鳥の写真、観察ガイド、そして保護活動の情報をお届けします',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
              },
            ],
            direction: 'ltr',
          },
        },
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: {
                root: {
                  type: 'root',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'heading',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '特集記事',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      tag: 'h2',
                    },
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '季節の野鳥、観察スポット、撮影テクニックなど、最新の情報をお届けします',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                  ],
                  direction: 'ltr',
                },
              },
            },
          ],
        },
        {
          blockType: 'content',
          columns: [
            {
              size: 'oneThird',
              richText: {
                root: {
                  type: 'root',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'heading',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🦜 鳥の種類',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      tag: 'h3',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '日本の野鳥から世界の珍しい鳥まで、様々な種類の小鳥たちを紹介します。特徴、生態、見分け方などを詳しく解説。',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                  ],
                  direction: 'ltr',
                },
              },
            },
            {
              size: 'oneThird',
              richText: {
                root: {
                  type: 'root',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'heading',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '📸 撮影ガイド',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      tag: 'h3',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '野鳥撮影のコツやテクニック、おすすめの機材など、美しい鳥の写真を撮るための情報が満載。',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                  ],
                  direction: 'ltr',
                },
              },
                },
            {
              size: 'oneThird',
              richText: {
                root: {
                  type: 'root',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'heading',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🌿 保護活動',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      tag: 'h3',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '野鳥と環境を守るための活動、参加できるイベント、日常でできる保護活動などを紹介します。',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 0,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                  ],
                  direction: 'ltr',
                },
              },
                },
          ],
        },
        {
          blockType: 'cta',
          richText: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'heading',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: '一緒に鳥たちの世界を探検しましょう',
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  tag: 'h4',
                },
                {
                  type: 'paragraph',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: 'メンバー登録をして、最新の野鳥情報や撮影テクニックを受け取りましょう',
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          },
          links: [
            {
              link: {
                type: 'custom',
                url: '/register',
                label: 'メンバー登録',
                newTab: false,
              },
                },
          ],
        },
      ],
      meta: {
        title: 'Kawaii Small Birds - かわいい小鳥たちの世界',
        description: '世界中のかわいい小鳥たちの魅力を伝えるウェブサイト。野鳥観察、撮影ガイド、保護活動の情報をお届けします。',
        image: null,
      },
      publishedDate: new Date().toISOString(),
      _status: 'published',
    }

    if (existingPages.docs.length > 0) {
      // Update existing page
      const pageId = existingPages.docs[0].id
      await payload.update({
        collection: 'pages',
        id: pageId,
        context: {
          disableRevalidate: true,
        },
        data: homePageData,
      })
      console.log('✅ Homepage updated successfully!')
    } else {
      // Create new page
      await payload.create({
        collection: 'pages',
        context: {
          disableRevalidate: true,
        },
        data: homePageData,
      })
      console.log('✅ Homepage created successfully!')
    }
  } catch (error) {
    console.error('❌ Error creating/updating homepage:', error)
  }

  process.exit(0)
}

createBirdHomepage()