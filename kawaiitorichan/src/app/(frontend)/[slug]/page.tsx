import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'
import { aboutStatic } from '@/endpoints/seed/about-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
// import { HeroWithSlideshow } from '@/components/HeroWithSlideshow'
// import { ModernHomepage } from '@/components/Homepage/ModernHomepage'
// import type { Post, Category } from '@/payload-types'

// Force dynamic rendering to avoid build-time Payload initialization issues
export const dynamic = 'force-dynamic'

// Completely disable static generation for Docker builds
// export async function generateStaticParams() {
//   // Skip static generation during build if no database connection
//   if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
//     return []
//   }

//   try {
//     const payload = await getPayload({ config: configPromise })
//     const pages = await payload.find({
//       collection: 'pages',
//       draft: false,
//       limit: 1000,
//       overrideAccess: false,
//       pagination: false,
//       select: {
//         slug: true,
//       },
//     })

//     const params = pages.docs
//       ?.filter((doc) => {
//         return doc.slug !== 'home'
//       })
//       .map(({ slug }) => {
//         return { slug }
//       })

//     return params
//   } catch (error) {
//     console.warn('Failed to generate static params:', error)
//     return []
//   }
// }

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  try {
    console.log('[Page] Starting page render...')
    console.log('[Page] NODE_ENV:', process.env.NODE_ENV)
    console.log('[Page] Params promise received')

    const { slug = 'home' } = await paramsPromise
    console.log('[Page] Slug:', slug)

    // If it's the homepage, render the modern homepage
    if (slug === 'home') {
      console.log('[Homepage] Skipping all data fetching - returning static HTML immediately')

      // Return static HTML WITHOUT any data fetching
      return (
        <div className="min-h-screen bg-white p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Kawaii Bird Blog - Static Test</h1>
            <p>This page loads without any database queries.</p>
            <p>If you see this, the website is working!</p>
            <p>NODE_ENV: {process.env.NODE_ENV}</p>
            <a href="/admin" className="text-blue-600 hover:underline">Admin Panel</a>
          </div>
        </div>
      )
    }

    // For other pages, use the original logic
    const { isEnabled: draft } = await draftMode()
    const url = '/' + slug

    let page: RequiredDataFromCollectionSlug<'pages'> | null

    page = await queryPageBySlug({
      slug,
    })

    // Static fallbacks for pages not in database
    if (!page) {
      if (slug === 'about-us') {
        page = aboutStatic
      } else {
        return <PayloadRedirects url={url} />
      }
    }

    const { hero, layout } = page

    return (
      <article className="pb-24">
        <PageClient />
        {/* Allows redirects for valid pages too */}
        <PayloadRedirects disableNotFound url={url} />

        {draft && <LivePreviewListener />}

        <RenderHero {...hero} />

        <RenderBlocks blocks={layout} />
      </article>
    )
  } catch (error) {
    console.error('Error loading page:', error)
    console.error('DATABASE_URI:', process.env.DATABASE_URI?.substring(0, 30) + '...')
    console.error('PAYLOAD_SECRET exists:', !!process.env.PAYLOAD_SECRET)

    // Return error page instead of throwing
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Error</h1>
          <p>An error occurred loading the page.</p>
          <pre className="mt-4 p-4 bg-gray-100 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    )
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise

  // Check homepage first, skip database query entirely
  if (slug === 'home') {
    return generateMeta({ doc: homeStatic })
  }

  // For other pages, try to query the database
  let page = await queryPageBySlug({
    slug,
  })

  // Use static fallback for metadata if page not found
  if (!page) {
    if (slug === 'about-us') {
      page = aboutStatic
    }
  }

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
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
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
