import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function createPetPalStyleHomepage() {
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
      title: 'かわいい小鳥の世界 - あなたの愛鳥ライフをサポート',
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
                type: 'paragraph',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: '🎉 期間限定！全商品20%OFF 🎉',
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
                type: 'heading',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: 'あなたの愛鳥ライフを',
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
                type: 'heading',
                format: 'center',
                indent: 0,
                version: 1,
                children: [
                  {
                    mode: 'normal',
                    text: '完全サポート！',
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
                    text: '野鳥観察から飼育まで、すべての鳥好きのためのワンストップショップ',
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
        // CTA Buttons Section
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: {
                root: {
                  type: 'root',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🛍️ 今すぐショッピング　　　📚 ケアガイドを見る',
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
        // Features Section
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
                          text: 'サービス一覧',
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
                          text: '鳥好きのあなたに最適なサービスをご提供',
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
        // Service Cards
        {
          blockType: 'content',
          columns: [
            {
              size: 'oneThird',
              richText: {
                root: {
                  type: 'root',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🦜',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '野鳥図鑑',
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
                          text: '500種類以上の野鳥データベース。写真と鳴き声で簡単識別',
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
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '📸',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '撮影ガイド',
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
                          text: 'プロ直伝の撮影テクニック。機材選びから構図まで完全解説',
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
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🏪',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: 'オンラインショップ',
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
                          text: '飼育用品から観察機材まで。厳選商品を最安値でご提供',
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
        // Second row of services
        {
          blockType: 'content',
          columns: [
            {
              size: 'oneThird',
              richText: {
                root: {
                  type: 'root',
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🩺',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '健康管理',
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
                          text: '獣医師監修の健康チェックリスト。病気の早期発見をサポート',
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
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '🎓',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '飼育講座',
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
                          text: '初心者から上級者まで。オンライン動画で学ぶ飼育テクニック',
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
                  format: 'center',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      type: 'paragraph',
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: '👥',
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
                      format: 'center',
                      indent: 0,
                      version: 1,
                      children: [
                        {
                          mode: 'normal',
                          text: 'コミュニティ',
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
                          text: '全国の鳥好きと情報交換。観察会やイベント情報も満載',
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
        // Statistics Section
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
                          text: '数字で見る実績',
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
                  format: 'center',
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
                          text: '50,000+',
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
                          text: '登録ユーザー',
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
                  format: 'center',
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
                          text: '500+',
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
                          text: '野鳥データ',
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
                  format: 'center',
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
                          text: '98%',
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
                          text: '満足度',
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
        // CTA Section
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
                      text: '今すぐ始めよう！',
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
                      text: '無料会員登録で、限定コンテンツと特別割引をゲット',
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
                label: '無料で始める',
                newTab: false,
              },
            },
            {
              link: {
                type: 'custom',
                url: '/pricing',
                label: 'プランを見る',
                newTab: false,
              },
            },
          ],
        },
      ],
      meta: {
        title: 'かわいい小鳥の世界 - あなたの愛鳥ライフをサポート',
        description: '野鳥観察から飼育まで、すべての鳥好きのためのワンストップショップ。500種類以上の野鳥データベース、撮影ガイド、飼育用品販売。',
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
      console.log('✅ Homepage updated with PetPal style!')
    } else {
      await payload.create({
        collection: 'pages',
        context: {
          disableRevalidate: true,
        },
        data: homePageData,
      })
      console.log('✅ Homepage created with PetPal style!')
    }
  } catch (error) {
    console.error('❌ Error updating homepage:', error)
  }

  process.exit(0)
}

createPetPalStyleHomepage()