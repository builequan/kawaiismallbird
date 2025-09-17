import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function updateJapaneseHomepage() {
  const payload = await getPayload({ config: configPromise })

  try {
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'home',
        },
      },
    })

    const homePageData = {
      title: 'かわいい小鳥の世界',
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
                    text: '🐦 かわいい小鳥たちの世界へようこそ 🐦',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 1, // Bold
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
                    text: '日本と世界の美しい野鳥たち、観察ガイド、撮影テクニック',
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
                    text: '小さくてかわいい鳥たちの魅力を一緒に探検しましょう！',
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
                          text: '✨ 今月の特集 ✨',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                          text: '季節の野鳥、人気の観察スポット、かわいい鳥の写真撮影テクニックなど',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🦜 鳥の種類図鑑',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                          text: 'メジロ、シジュウカラ、カワセミなど、日本の身近な野鳥から世界の珍しい小鳥まで、豊富な写真と詳しい解説でご紹介します。',
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
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🌸 季節ごとの野鳥',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🏞️ 生息地別ガイド',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '📸 撮影のコツ',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                          text: '初心者でも簡単！かわいい野鳥を上手に撮影するテクニックと、おすすめの機材をプロカメラマンが解説。',
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
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '📷 カメラ設定ガイド',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🎨 構図のポイント',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🌿 保護活動',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                          text: '野鳥と自然環境を守るための活動、参加できるイベント情報、日常でできる保護活動をご紹介。',
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
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🏡 バードフレンドリーな庭づくり',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                    },
                    {
                      type: 'paragraph',
                      format: '',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '💚 保護団体の活動',
                          type: 'text',
                          style: '',
                          detail: 0,
                          format: 1,
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
                      text: '🌈 一緒に鳥たちの世界を楽しみましょう！',
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 1,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  tag: 'h3',
                },
                {
                  type: 'paragraph',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: 'メンバー登録をして、最新の野鳥情報、かわいい写真、観察イベントの情報を受け取りましょう',
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
                label: '🎀 無料メンバー登録',
                newTab: false,
              },
            },
          ],
        },
      ],
      meta: {
        title: 'かわいい小鳥の世界 - Kawaii Small Birds',
        description: '日本と世界のかわいい小鳥たちの魅力を紹介。野鳥観察、撮影ガイド、保護活動の情報サイト。',
        image: null,
      },
      publishedDate: new Date().toISOString(),
      _status: 'published',
    }

    if (existingPages.docs.length > 0) {
      const pageId = existingPages.docs[0].id
      await payload.update({
        collection: 'pages',
        id: pageId,
        context: {
          disableRevalidate: true,
        },
        data: homePageData,
      })
      console.log('✅ Homepage updated with Japanese content!')
    } else {
      await payload.create({
        collection: 'pages',
        context: {
          disableRevalidate: true,
        },
        data: homePageData,
      })
      console.log('✅ Homepage created with Japanese content!')
    }
  } catch (error) {
    console.error('❌ Error updating homepage:', error)
  }

  process.exit(0)
}

updateJapaneseHomepage()