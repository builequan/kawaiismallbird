import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function createAboutUsPage() {
  const payload = await getPayload({ config: configPromise })

  try {
    // Check if about-us page already exists
    const existingPages = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'about-us',
        },
      },
    })

    if (existingPages.docs.length > 0) {
      // Update existing page
      const pageId = existingPages.docs[0].id
      const updatedPage = await payload.update({
        collection: 'pages',
        id: pageId,
        context: {
          disableRevalidate: true,
        },
        data: {
          title: 'About Us - Kawaii Small Birds',
          slug: 'about-us',
          hero: {
            type: 'lowImpact',
            media: null,
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
                    format: '',
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
                              text: '私たちのミッション',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: 'Kawaii Small Birdsは、世界中のかわいい小鳥たちの魅力を伝えることを使命としています。私たちは、これらの小さな生き物たちの美しさ、個性、そして生態系における重要性を広く知ってもらいたいと考えています。',
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
                              text: 'Our mission at Kawaii Small Birds is to share the charm and wonder of adorable small birds from around the world. We believe in celebrating these tiny creatures\' beauty, unique personalities, and their vital role in our ecosystems.',
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
                              text: '私たちが大切にしていること',
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
                                  text: '鳥たちの保護と環境保全 - Bird Conservation and Environmental Protection',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 0,
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
                                  text: '正確な情報の提供 - Providing Accurate Information',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 0,
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
                                  text: '野鳥観察の楽しさを広める - Promoting the Joy of Birdwatching',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 0,
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
                                  text: '写真と動画による美しい記録 - Beautiful Documentation through Photos and Videos',
                                  type: 'text',
                                  style: '',
                                  detail: 0,
                                  format: 0,
                                  version: 1,
                                },
                              ],
                              direction: 'ltr',
                              value: 4,
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
                              text: '私たちのチーム',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: '私たちは、鳥類学者、写真家、自然愛好家、そして世界中の小鳥ファンから成る情熱的なチームです。日本の美しい野鳥から世界各地の珍しい種まで、幅広い知識と経験を共有しています。',
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
                              text: 'We are a passionate team of ornithologists, photographers, nature enthusiasts, and bird lovers from around the world. From Japan\'s beautiful wild birds to rare species across the globe, we share a wealth of knowledge and experience.',
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
                              text: 'お問い合わせ',
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
                          format: '',
                          indent: 0,
                          version: 1,
                          children: [
                            {
                              mode: 'normal',
                              text: 'ご質問、ご提案、または野鳥の情報共有については、お気軽にお問い合わせください。私たちは常に新しい発見や美しい鳥の写真を歓迎しています。',
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
                              text: 'For questions, suggestions, or sharing bird information, please feel free to contact us. We always welcome new discoveries and beautiful bird photography.',
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
                  id: '1',
                },
              ],
              id: '1',
            },
          ],
          meta: {
            title: 'About Us - Kawaii Small Birds',
            description: 'Learn about our mission to share the beauty and wonder of kawaii small birds from around the world.',
            image: null,
          },
          publishedDate: new Date().toISOString(),
          _status: 'published',
        },
      })
      console.log('✅ About Us page updated successfully!')
    } else {
      // Create new page
      const newPage = await payload.create({
        collection: 'pages',
        context: {
          disableRevalidate: true,
        },
        data: {
          title: 'About Us - Kawaii Small Birds',
          slug: 'about-us',
          hero: {
            type: 'lowImpact',
            media: null,
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
                    format: '',
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
                ],
                direction: 'ltr',
              },
            },
          },
          _status: 'published',
        },
      })
      console.log('✅ About Us page created successfully!')
    }
  } catch (error) {
    console.error('❌ Error creating/updating About Us page:', error)
  }

  process.exit(0)
}

createAboutUsPage()