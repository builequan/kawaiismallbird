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
import { HeroWithSlideshow } from '@/components/HeroWithSlideshow'
import { ModernHomepage } from '@/components/Homepage/ModernHomepage'
import type { Post, Category } from '@/payload-types'

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
    const { isEnabled: draft } = await draftMode()
    const { slug = 'home' } = await paramsPromise
    const url = '/' + slug

    // If it's the homepage, render the modern homepage
    if (slug === 'home') {
      console.log('[Homepage] Starting to fetch data...')
      const payload = await getPayload({ config: configPromise })
      console.log('[Homepage] Payload instance obtained')

      // Fetch featured posts (most recent posts) - depth 0 to avoid category population errors
      console.log('[Homepage] Fetching featured posts...')
      const featuredPosts = await payload.find({
        collection: 'posts',
        draft,
        limit: 9,
        sort: '-publishedAt',
        where: {
          _status: {
            equals: 'published'
          }
        },
        depth: 0,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          heroImage: true,
          meta: true,
        }
      })
      console.log('[Homepage] Featured posts fetched:', featuredPosts.totalDocs)

      // Fetch recent posts - depth 0 to avoid category population errors
      console.log('[Homepage] Fetching recent posts...')
      const recentPosts = await payload.find({
        collection: 'posts',
        draft,
        limit: 6,
        sort: '-publishedAt',
        where: {
          _status: {
            equals: 'published'
          }
        },
        depth: 0,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          heroImage: true,
          meta: true,
        }
      })
      console.log('[Homepage] Recent posts fetched:', recentPosts.totalDocs)

      // For now, use recent posts as popular posts - depth 0 to avoid category population errors
      console.log('[Homepage] Fetching popular posts...')
      const popularPosts = await payload.find({
        collection: 'posts',
        draft,
        limit: 5,
        sort: '-publishedAt',
        where: {
          _status: {
            equals: 'published'
          }
        },
        depth: 0,
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
          heroImage: true,
          meta: true,
        }
      })
      console.log('[Homepage] Popular posts fetched:', popularPosts.totalDocs)

      // Fetch categories and count posts for each
      console.log('[Homepage] Fetching categories...')
      const categories = await payload.find({
        collection: 'categories',
        draft,
        limit: 100,
        depth: 0,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
        }
      })
      console.log('[Homepage] Categories fetched:', categories.totalDocs)

      // Since posts_rels table is empty, skip relationship queries and set postCount to 0
      console.log('[Homepage] Adding postCount to categories (skipping relationship queries)...')
      const categoriesWithCounts = categories.docs.map((category) => ({
        ...category,
        postCount: 0
      }))
      console.log('[Homepage] All data fetched successfully, rendering...')

      return (
        <>
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}

          <ModernHomepage
            featuredPosts={featuredPosts.docs as Post[]}
            recentPosts={recentPosts.docs as Post[]}
            popularPosts={popularPosts.docs as Post[]}
            categories={categoriesWithCounts}
          />
        </>
      )
    }

    // For other pages, use the original logic
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
    throw error
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  let page = await queryPageBySlug({
    slug,
  })

  // Use static fallback for metadata if page not found
  if (!page) {
    if (slug === 'home') {
      page = homeStatic
    } else if (slug === 'about-us') {
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
