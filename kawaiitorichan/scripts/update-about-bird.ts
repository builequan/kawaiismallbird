import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function updateAboutPage() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Check if about page exists
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'about',
        },
      },
    })

    const aboutPageData = {
      slug: 'about',
      title: '私たちについて',
      _status: 'published' as const,
      hero: {
        type: 'lowImpact' as const,
        richText: {
          root: {
            children: [
              {
                children: [
                  {
                    text: 'Kawaii Birdについて',
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
                    text: '小さくてかわいい鳥たちの魅力を伝えるブログです。',
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
        title: '私たちについて - Kawaii Bird',
        description: '小さくてかわいい鳥たちの魅力を伝えるブログサイト',
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              richText: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'heading',
                      tag: 'h2',
                      children: [
                        {
                          text: '私たちのミッション',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'Kawaii Birdは、小鳥たちの可愛らしさと魅力を世界中の人々と共有することを目的としています。',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: '私たちは以下のことを大切にしています：',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'list',
                      listType: 'bullet',
                      children: [
                        {
                          type: 'listitem',
                          children: [
                            {
                              text: '鳥たちの美しい写真と動画の共有',
                              type: 'text',
                            },
                          ],
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              text: '鳥の生態や習性についての正確な情報提供',
                              type: 'text',
                            },
                          ],
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              text: '鳥たちとの幸せな暮らし方のアドバイス',
                              type: 'text',
                            },
                          ],
                          version: 1,
                        },
                        {
                          type: 'listitem',
                          children: [
                            {
                              text: '野鳥観察の楽しみ方の紹介',
                              type: 'text',
                            },
                          ],
                          version: 1,
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'heading',
                      tag: 'h2',
                      children: [
                        {
                          text: 'なぜ小鳥が大切なのか',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: '小鳥たちは私たちの生活に彩りと癒しをもたらしてくれます。その愛らしい姿と美しい歌声は、日々のストレスから私たちを解放し、自然とのつながりを思い出させてくれます。',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'heading',
                      tag: 'h2',
                      children: [
                        {
                          text: 'お問い合わせ',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'ご質問やご意見がございましたら、お気軽にお問い合わせください。',
                          type: 'text',
                        },
                      ],
                      version: 1,
                    },
                  ],
                  version: 1,
                  indent: 0,
                  direction: 'ltr',
                  format: '',
                },
              },
              id: 'content-01',
            },
          ],
          id: 'about-content-01',
        },
      ],
    }

    if (existingPages.docs.length > 0) {
      // Update existing about page
      await payload.update({
        collection: 'pages',
        id: existingPages.docs[0].id,
        data: aboutPageData,
      })
      console.log('✅ About page updated successfully with bird theme!')
    } else {
      // Create new about page
      await payload.create({
        collection: 'pages',
        data: aboutPageData,
      })
      console.log('✅ About page created successfully with bird theme!')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to update about page:', error)
    process.exit(1)
  }
}

updateAboutPage()