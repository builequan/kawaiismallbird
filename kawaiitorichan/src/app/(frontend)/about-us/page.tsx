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

// Force dynamic rendering - don't pre-render during build
export const dynamic = 'force-dynamic'

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

  return (
    <article className="min-h-screen bg-white">
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