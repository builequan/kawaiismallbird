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

export default async function AboutUsPage() {
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
    <article className="pb-24">
      <PayloadRedirects disableNotFound url="/about-us" />
      {draft && <LivePreviewListener />}
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
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