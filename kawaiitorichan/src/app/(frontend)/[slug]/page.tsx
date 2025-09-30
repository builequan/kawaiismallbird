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
          hero: true,
          excerpt: true,
          categories: true,
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
          hero: true,
          excerpt: true,
          categories: true,
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
          hero: true,
          excerpt: true,
          categories: true,
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

      // Try to render a simple version first to identify the issue
      try {
        // Clean the data to ensure it's serializable
        const cleanPosts = (posts: any[]) => {
          return posts.map(post => {
            try {
              return {
                id: post.id,
                title: post.title || 'Untitled',
                slug: post.slug || '',
                publishedAt: post.publishedAt || new Date().toISOString(),
                // Remove complex fields that might cause issues
                // heroImage: post.heroImage || null,
                // hero: post.hero || null,
                // excerpt: post.excerpt || null,
                // categories: post.categories || [],
                // meta: post.meta || null,
              }
            } catch (e) {
              console.error('[Homepage] Error cleaning post:', e)
              return {
                id: post.id || 0,
                title: 'Error',
                slug: 'error',
                publishedAt: new Date().toISOString(),
              }
            }
          })
        }

        const cleanedFeatured = cleanPosts(featuredPosts.docs)
        const cleanedRecent = cleanPosts(recentPosts.docs)
        const cleanedPopular = cleanPosts(popularPosts.docs)

        console.log('[Homepage] Cleaned data, attempting render...')

        // For now, just render a simple list to test
        return (
          <div className="min-h-screen bg-white p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">🦜 Kawaii Bird Blog</h1>

              <div className="mb-8 p-4 bg-green-50 rounded-lg">
                <p>✅ Posts loaded: {featuredPosts.totalDocs}</p>
                <p>✅ Categories loaded: {categories.totalDocs}</p>
              </div>

              <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
              <ul className="space-y-2">
                {cleanedRecent.slice(0, 10).map((post) => (
                  <li key={post.id} className="border-b pb-2">
                    <a href={`/posts/${post.slug}`} className="text-blue-600 hover:underline">
                      {post.title}
                    </a>
                  </li>
                ))}
              </ul>

              <h2 className="text-2xl font-semibold mb-4 mt-8">Categories</h2>
              <ul className="space-y-2">
                {categoriesWithCounts.slice(0, 10).map((cat) => (
                  <li key={cat.id}>
                    {cat.title} ({cat.postCount} posts)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      } catch (error) {
        console.error('[Homepage] Render error:', error)

        return (
          <div className="min-h-screen bg-white p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">Homepage Error</h1>
              <p className="text-red-600">Failed to render homepage</p>
              <pre className="mt-4 p-4 bg-gray-100 rounded">
                {String(error)}
              </pre>
            </div>
          </div>
        )
      }
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
