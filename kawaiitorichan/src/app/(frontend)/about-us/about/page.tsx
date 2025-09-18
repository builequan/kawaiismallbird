import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'

import configPromise from '@payload-config'

import { getPayload } from 'payload'

import { draftMode } from 'next/headers'

import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'

import { RenderHero } from '@/heros/RenderHero'

import { generateMeta } from '@/utilities/generateMeta'

import { LivePreviewListener } from '@/components/LivePreviewListener'

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const { isEnabled: draft } = await draftMode()
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

  const page = result.docs?.[0]

  if (!page) {
    return <PayloadRedirects url="/about-us" />
  }

  const { hero, layout } = page

  return (
    <article className="min-h-screen bg-white">
      <PayloadRedirects disableNotFound url="/about-us" />
      {draft && <LivePreviewListener />}
      <div className="bg-white">
        <RenderHero {...hero} />
        <div className="prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900">
          <RenderBlocks blocks={layout} />
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
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

  const page = result.docs?.[0]
  return generateMeta({ doc: page })
}