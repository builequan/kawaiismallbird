import type { RequiredDataFromCollectionSlug } from 'payload'

// Static fallback for About Us page when database is not seeded
export const aboutStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'about-us',
  _status: 'published',
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
            tag: 'h1',
            type: 'heading',
            format: 'center',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: '小鳥と暮らす幸せな毎日へ',
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
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: '私たちのビジョン' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: 'Kawaii Birdは、小鳥をペットとして飼育する方々のための総合情報サイトです。セキセイインコ、オカメインコ、フィンチなど、人気の小鳥たちの飼育方法、健康管理、栄養管理など、小鳥と幸せに暮らすための実践的な情報をお届けしています。',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: '私たちが大切にしていること' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'list',
                  listType: 'bullet',
                  version: 1,
                  children: [
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '🐦 小鳥の種類別の詳しい飼育ガイド' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '🏥 健康管理と病気予防の正確な情報' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '🥗 栄養バランスの取れた食事管理' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '🏠 快適なケージ環境の作り方' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '💝 小鳥との絆を深めるトレーニング方法' }
                      ],
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: 'なぜ小鳥が大切なのか' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '小鳥たちは私たちの生活に彩りと癒しをもたらしてくれます。その愛らしい姿と美しい歌声は、日々のストレスから私たちを解放し、自然とのつながりを思い出させてくれます。',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '私たちは、この素晴らしい小鳥たちの世界を、より多くの人々と共有したいと考えています。一緒に小鳥たちの魅力を探求し、彼らとの素敵な時間を過ごしましょう。',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: 'お問い合わせ' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '鳥に関するご質問やご意見、写真の投稿など、お気軽にお問い合わせください。私たちは鳥を愛するすべての方々からのメッセージをお待ちしています。',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
      ],
    },
  ],
  meta: {
    title: 'わたしたちについて - Kawaii Bird',
    description: '日本と世界のかわいい小鳥たちの魅力を伝える、私たちのミッションとチームについて。',
  },
  title: 'わたしたちについて',
  id: 4,
  createdAt: '2025-09-02T14:25:19.974Z',
  updatedAt: '2025-09-15T14:59:31.213Z',
}