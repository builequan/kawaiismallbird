import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'

import configPromise from '@payload-config'

import { getPayload } from 'payload'

import { draftMode } from 'next/headers'

import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'

import { generateMeta } from '@/utilities/generateMeta'

import { LivePreviewListener } from '@/components/LivePreviewListener'

import { termsOfServiceStatic } from '@/endpoints/seed/terms-of-service-static'

import { HeroWithSlideshow } from '@/components/HeroWithSlideshow'

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic'

export default async function TermsOfServicePage() {
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
          equals: 'terms-of-service',
        },
      },
    })

    page = result.docs?.[0]
  } catch (error) {
    console.log('Failed to fetch terms of service page from database, using static fallback')
    page = null
  }

  // Use static fallback if page not found in database
  if (!page) {
    page = termsOfServiceStatic
  }

  const { hero, layout } = page

  return (
    <article className="min-h-screen bg-white">
      <PayloadRedirects disableNotFound url="/terms-of-service" />
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
          equals: 'terms-of-service',
        },
      },
    })

    page = result.docs?.[0]
  } catch (error) {
    console.log('Failed to fetch terms of service page metadata from database, using static fallback')
    page = null
  }

  // Use static fallback if page not found
  if (!page) {
    page = termsOfServiceStatic
  }

  return generateMeta({ doc: page })
}
