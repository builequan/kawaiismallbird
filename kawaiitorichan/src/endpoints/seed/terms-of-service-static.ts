import type { RequiredDataFromCollectionSlug } from 'payload'

// Static fallback for Terms of Service page
export const termsOfServiceStatic: RequiredDataFromCollectionSlug<'pages'> = {
  slug: 'terms-of-service',
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
                text: '利用規約',
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
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '本利用規約（以下「本規約」）は、Kawaii Bird（以下「当サイト」）の利用条件を定めるものです。当サイトをご利用になる場合は、本規約に同意したものとみなします。',
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
                  children: [{ type: 'text', text: '第1条（適用）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '本規約は、当サイトの利用に関わる一切の関係に適用されるものとします。',
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
                  children: [{ type: 'text', text: '第2条（コンテンツについて）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトに掲載されているコンテンツ（文章、画像、動画等）は、小鳥の飼育に関する一般的な情報提供を目的としています。専門的な医療アドバイスの代わりとなるものではありません。小鳥の健康に関する問題がある場合は、必ず獣医師にご相談ください。',
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
                  children: [{ type: 'text', text: '第3条（禁止事項）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: 'ユーザーは、当サイトの利用にあたり、以下の行為をしてはなりません：',
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
                  type: 'list',
                  listType: 'bullet',
                  version: 1,
                  children: [
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '法令または公序良俗に違反する行為' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '犯罪行為に関連する行為' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトのコンテンツを無断で複製、転載、販売する行為' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトの運営を妨害する行為' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '他のユーザーまたは第三者に不利益、損害を与える行為' }
                      ],
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: '第4条（著作権）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトに掲載されているコンテンツの著作権は、当サイトまたは正当な権利者に帰属します。これらのコンテンツを私的使用の範囲を超えて使用する場合は、事前に書面による許可が必要です。',
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
                  children: [{ type: 'text', text: '第5条（免責事項）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトは、以下の事項について一切の責任を負いません：',
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
                  type: 'list',
                  listType: 'bullet',
                  version: 1,
                  children: [
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトの情報を利用したことによる直接的または間接的な損害' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトの情報の正確性、完全性、有用性' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトからリンクされた外部サイトの内容' }
                      ],
                    },
                    {
                      type: 'listitem',
                      version: 1,
                      children: [
                        { type: 'text', text: '当サイトの中断、停止、変更、終了' }
                      ],
                    },
                  ],
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ type: 'text', text: '第6条（アフィリエイトリンク）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトには、Amazon、楽天市場、その他のアフィリエイトプログラムのリンクが含まれています。これらのリンクを通じて商品を購入された場合、当サイトは紹介料を受け取ることがあります。商品の購入はお客様の判断と責任において行ってください。',
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
                  children: [{ type: 'text', text: '第7条（サービスの変更・終了）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトは、事前の通知なく、サービスの内容を変更したり、サービスの提供を中止したりすることができます。これによってユーザーに生じた損害について、当サイトは一切の責任を負いません。',
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
                  children: [{ type: 'text', text: '第8条（利用規約の変更）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '当サイトは、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができます。変更後の利用規約は、当サイトに掲載した時点から効力を生じるものとします。',
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
                  children: [{ type: 'text', text: '第9条（準拠法・裁判管轄）' }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
                {
                  type: 'paragraph',
                  children: [{
                    type: 'text',
                    text: '本規約の解釈は、日本法に準拠するものとします。当サイトに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
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
                    text: '最終更新日：2025年12月12日',
                    detail: 0,
                    format: 2,
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
    title: '利用規約 | Kawaii Bird - 小鳥の飼育情報サイト',
    description: 'Kawaii Birdの利用規約です。当サイトをご利用いただく際の条件についてご説明いたします。',
  },
  title: '利用規約',
  id: 6,
  createdAt: '2025-12-12T00:00:00.000Z',
  updatedAt: '2025-12-12T00:00:00.000Z',
}
