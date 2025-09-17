import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function updateJapaneseAboutPage() {
  const payload = await getPayload({ config: configPromise })

  try {
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'about-us',
        },
      },
    })

    if (existingPages.docs.length > 0) {
      const pageId = existingPages.docs[0].id
      await payload.update({
        collection: 'pages',
        id: pageId,
        context: {
          disableRevalidate: true,
        },
        data: {
          title: 'わたしたちについて',
          slug: 'about-us',
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
                        text: '🕊️ かわいい小鳥の世界について 🕊️',
                        type: 'text',
                        style: '',
                        detail: 0,
                        format: 1,
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    tag: 'h1',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '🌸 私たちのミッション',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '「かわいい小鳥の世界」は、日本と世界中の小さくてかわいい鳥たちの魅力を多くの人々に伝えることを使命としています。',
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
                              text: '私たちは、これらの愛らしい生き物たちの美しさ、個性的な行動、そして自然環境における大切な役割について、楽しく学べる情報をお届けします。',
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
                          type: 'heading',
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '🎀 私たちが大切にしていること',
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
                          type: 'list',
                          listType: 'bullet',
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              type: 'listitem',
                              format: '',
                              indent: 0,
                              version: 1,
                              children: [
                                {
                                  mode: 'normal',
                                  text: '🦜 鳥たちの命と環境を守ること',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 1,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 1,
                            },
                            {
                              type: 'listitem',
                              format: '',
                              indent: 0,
                              version: 1,
                              children: [
                                {
                                  mode: 'normal',
                                  text: '📚 正確でわかりやすい情報の提供',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 1,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 2,
                            },
                            {
                              type: 'listitem',
                              format: '',
                              indent: 0,
                              version: 1,
                              children: [
                                {
                                  mode: 'normal',
                                  text: '🌈 野鳥観察の楽しさを広めること',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 1,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 3,
                            },
                            {
                              type: 'listitem',
                              format: '',
                              indent: 0,
                              version: 1,
                              children: [
                                {
                                  mode: 'normal',
                                  text: '📸 美しい写真と動画による記録',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 1,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 4,
                            },
                            {
                              type: 'listitem',
                              format: '',
                              indent: 0,
                              version: 1,
                              children: [
                                {
                                  mode: 'normal',
                                  text: '💝 子どもたちへの自然教育',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 1,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 5,
                            },
                          ],
                          direction: 'ltr',
                          start: 1,
                          tag: 'ul',
                        },
                        {
                          type: 'heading',
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '👥 私たちのチーム',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '私たちは、鳥類学者、自然写真家、イラストレーター、そして何より鳥を愛する人々から成る情熱的なチームです。',
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
                              text: '日本の四季折々の野鳥から、世界各地の珍しくてかわいい小鳥まで、幅広い知識と経験を活かして、みなさまに楽しく有益な情報をお届けしています。',
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
                          type: 'heading',
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '✉️ お問い合わせ',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: 'ご質問、ご提案、野鳥の目撃情報など、お気軽にお問い合わせください。',
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
                              text: 'また、かわいい鳥の写真や動画の投稿も大歓迎です！みなさまからの情報が、このサイトをより豊かなものにしていきます。',
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
                              text: '🐦 一緒に小鳥たちの世界を楽しみましょう！ 🐦',
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
          ],
          meta: {
            title: 'わたしたちについて - かわいい小鳥の世界',
            description: '日本と世界のかわいい小鳥たちの魅力を伝える、私たちのミッションとチームについて。',
            image: null,
          },
          publishedDate: new Date().toISOString(),
          _status: 'published',
        },
      })
      console.log('✅ About Us page updated with Japanese-only content!')
    }
  } catch (error) {
    console.error('❌ Error updating About Us page:', error)
  }

  process.exit(0)
}

updateJapaneseAboutPage()