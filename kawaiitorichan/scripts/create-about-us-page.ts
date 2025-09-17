import { getPayload } from 'payload'
import config from '../src/payload.config'

const createAboutUsPage = async () => {
  const payload = await getPayload({ config })

  console.log('Creating About Us page...')

  const aboutUsPageData = {
    title: '私たちについて',
    slug: 'about-us',
    _status: 'published' as const,
    hero: {
      type: 'none' as const,
    },
    layout: [
      {
        blockType: 'heroBlog',
        title: '私たちについて',
        subtitle: 'ゴルフを愛するすべての人のために',
        gradientStyle: 'mintBlue',
        layout: 'center',
      },
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
                    children: [{ type: 'text', text: '私たちの使命' }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'heading',
                    tag: 'h3',
                    children: [{ type: 'text', text: 'ゴルフライフを豊かにするパートナー', format: 1 }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [{ 
                      type: 'text', 
                      text: '私たちは、ゴルフを通じて人生をより豊かにしたいと願うすべての方々のお手伝いをしています。初心者の方が最初の一歩を踏み出すお手伝いから、上級者の方がさらなる高みを目指すサポートまで、一人ひとりのゴルフジャーニーに寄り添います。',
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
                      text: 'ゴルフは技術や体力だけでなく、精神力や戦略性も求められる奥深いスポーツです。その魅力を余すことなくお伝えし、皆様のゴルフライフがより充実したものになるよう、私たちは日々努力を続けています。',
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
                    children: [{ type: 'text', text: '私たちの想い' }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'heading',
                    tag: 'h3',
                    children: [{ type: 'text', text: 'ゴルフの真の価値を伝えたい', format: 1 }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [{ 
                      type: 'text', 
                      text: 'ゴルフは単なるスポーツではありません。美しい自然の中で自分自身と向き合い、仲間との絆を深め、人生の様々な教訓を学ぶことができる特別な体験です。',
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
                    start: 1,
                    tag: 'ul',
                    children: [
                      {
                        type: 'listitem',
                        children: [
                          { type: 'text', text: '自然との調和', format: 1 },
                          { type: 'text', text: ': 四季折々の美しいコースで、自然の恵みを感じながらプレーする喜び' }
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        version: 1,
                        value: 1,
                      },
                      {
                        type: 'listitem',
                        children: [
                          { type: 'text', text: '技術の追求', format: 1 },
                          { type: 'text', text: ': 一打一打に込められた技術と情熱、そして絶えざる向上心' }
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        version: 1,
                        value: 2,
                      },
                      {
                        type: 'listitem',
                        children: [
                          { type: 'text', text: '人との繋がり', format: 1 },
                          { type: 'text', text: ': ゴルフを通じて生まれる友情や、世代を超えた交流の価値' }
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        version: 1,
                        value: 3,
                      },
                      {
                        type: 'listitem',
                        children: [
                          { type: 'text', text: '精神的成長', format: 1 },
                          { type: 'text', text: ': 困難な状況での判断力、集中力、そして諦めない心の育成' }
                        ],
                        direction: 'ltr',
                        format: '',
                        indent: 0,
                        version: 1,
                        value: 4,
                      },
                    ],
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
                    children: [{ type: 'text', text: '一緒に歩むゴルフジャーニー' }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'heading',
                    tag: 'h3',
                    children: [{ type: 'text', text: 'あなたの成長を支える仲間として', format: 1 }],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [{ 
                      type: 'text', 
                      text: 'ゴルフは一生続けられる素晴らしいスポーツです。技術の向上はもちろんのこと、自然との触れ合い、仲間との交流、そして自分自身の成長など、ゴルフから得られるものは計り知れません。',
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
                      text: '私たちは、あなたのゴルフライフのあらゆる場面で、信頼できるパートナーでありたいと考えています。初めてクラブを握る方から、長年ゴルフを愛し続けている方まで、すべての方に寄り添い、共に歩んでいきたいと思います。',
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
                      text: 'あなたのゴルフストーリーは、今日から始まります。私たちと一緒に、素晴らしいゴルフの世界を探索し、一生の思い出となる体験を積み重ねていきましょう。',
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
                      text: '※当サイトでは、コンテンツ作成や画像生成にAI技術を活用しています。情報の正確性については細心の注意を払っておりますが、内容をご利用の際は十分にご確認いただきますようお願いいたします。',
                      detail: 0,
                      format: 8,
                      mode: 'normal',
                      style: 'font-size: 0.875rem; color: #6b7280; margin-top: 2rem;',
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
      {
        blockType: 'callToAction',
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                tag: 'h3',
                children: [{ type: 'text', text: 'ご質問やご相談はお気軽に' }],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
              {
                type: 'paragraph',
                children: [{ 
                  type: 'text', 
                  text: '私たちはいつでもあなたをサポートする準備ができています。'
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
        links: [
          {
            link: {
              type: 'custom',
              url: '/contact',
              label: 'お問い合わせ',
              appearance: 'primary',
            },
          },
        ],
      },
    ],
    meta: {
      title: '私たちについて | ゴルフを愛するすべての人のために',
      description: 'ゴルフを通じて人生をより豊かにしたいと願うすべての方々のお手伝いをしています。私たちのミッション、サービス、そしてあなたのゴルフライフを支えるコミットメントについてご紹介します。',
    },
  }

  try {
    // Check if the page already exists
    const existing = await payload.find({
      collection: 'pages',
      where: {
        slug: { equals: 'about-us' }
      },
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      console.log('About Us page already exists. Updating...')
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data: aboutUsPageData,
        overrideAccess: true,
        context: {
          disableRevalidate: true,
        },
      })
      console.log('About Us page updated successfully!')
    } else {
      console.log('Creating new About Us page...')
      await payload.create({
        collection: 'pages',
        data: aboutUsPageData,
        overrideAccess: true,
        context: {
          disableRevalidate: true,
        },
      })
      console.log('About Us page created successfully!')
    }

    console.log('About Us page is now accessible at: http://localhost:3001/about-us')
  } catch (error) {
    console.error('Error creating About Us page:', error)
  }

  process.exit(0)
}

createAboutUsPage()