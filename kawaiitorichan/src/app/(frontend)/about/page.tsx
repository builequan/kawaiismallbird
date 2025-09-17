import type { Metadata } from 'next'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { PayloadRedirects } from '@/components/PayloadRedirects'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import configPromise from '@payload-config'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { getPayload } from 'payload'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { draftMode } from 'next/headers'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import React from 'react'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { RenderBlocks } from '@/blocks/RenderBlocks'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { RenderHero } from '@/heros/RenderHero'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { generateMeta } from '@/utilities/generateMeta'

// Force dynamic rendering - do not pre-render during build
export const dynamic = 'force-dynamic'
import { LivePreviewListener } from '@/components/LivePreviewListener'

// Force dynamic rendering - do not pre-render during build
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
    return <PayloadRedirects url="/about" />
  }

  const { hero, layout } = page

  return (
    <article className="min-h-screen bg-white">
      <PayloadRedirects disableNotFound url="/about" />
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