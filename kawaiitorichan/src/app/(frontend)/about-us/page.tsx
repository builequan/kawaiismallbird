import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'

import configPromise from '@payload-config'

import { getPayload } from 'payload'

import { draftMode } from 'next/headers'

import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'

import { generateMeta } from '@/utilities/generateMeta'

import { LivePreviewListener } from '@/components/LivePreviewListener'

import { aboutStatic } from '@/endpoints/seed/about-static'

import { HeroWithSlideshow } from '@/components/HeroWithSlideshow'

import { getServerSideURL } from '@/utilities/getURL'

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic'

function generateAboutPageSchema() {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'わたしたちについて - Kawaii Bird',
    description: '小鳥の飼育歴10年以上の愛鳥家チームが運営する、信頼性の高い小鳥飼育情報サイトです。',
    url: `${serverUrl}/about-us`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Kawaii Small Bird',
      url: serverUrl,
      description: '小鳥の飼育、健康管理、種類に関する総合情報サイト。獣医師監修のもと、信頼性の高い情報をお届けしています。',
      foundingDate: '2024',
      member: [
        {
          '@type': 'Person',
          name: '鈴木 みどり',
          jobTitle: '編集長・コンテンツ責任者',
        },
        {
          '@type': 'Person',
          name: '田中 はるか',
          jobTitle: '健康・栄養担当ライター',
        },
        {
          '@type': 'Person',
          name: '佐藤 ことり',
          jobTitle: '飼育環境・用品担当ライター',
        },
      ],
    },
    inLanguage: 'ja',
  }
}

export default async function AboutPage() {
  const { isEnabled: draft } = await draftMode()

  let page

  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'pages',
      draft,
      limit: 1,
      pagination: false,
      overrideAccess: draft,
      where: {
        slug: {
          equals: 'about-us',
        },
      },
    })

    page = result.docs?.[0]
  } catch (error) {
    console.log('Failed to fetch about page from database, using static fallback')
    page = null
  }

  // Use static fallback if page not found in database
  if (!page) {
    page = aboutStatic
  }

  const { hero, layout } = page
  const aboutPageSchema = generateAboutPageSchema()

  return (
    <article className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <PayloadRedirects disableNotFound url="/about-us" />
      {draft && <LivePreviewListener />}
      <div className="bg-white">
        <HeroWithSlideshow hero={hero} />
        <div className="prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900">
          <RenderBlocks blocks={layout} />
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  let page

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      limit: 1,
      pagination: false,
      where: {
        slug: {
          equals: 'about-us',
        },
      },
    })

    page = result.docs?.[0]
  } catch (error) {
    console.log('Failed to fetch about page metadata from database, using static fallback')
    page = null
  }

  // Use static fallback if page not found
  if (!page) {
    page = aboutStatic
  }

  return generateMeta({ doc: page })
}