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
import { fixMediaUrl } from '@/utilities/fixMediaUrl'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { BirdSlideshow } from '@/components/BirdSlideshow'
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
      console.log('[Homepage] Starting to fetch data...')

      try {
        const payload = await getPayload({ config: configPromise })
        const { isEnabled: draft } = await draftMode()

        // Get posts count first to verify database is working
        const postCount = await payload.count({
          collection: 'posts',
          where: {
            _status: {
              equals: 'published'
            }
          }
        })
        console.log('[Homepage] Total published posts:', postCount.totalDocs)

        // Get categories count
        const categoryCount = await payload.count({
          collection: 'categories'
        })
        console.log('[Homepage] Total categories:', categoryCount.totalDocs)

        // Fetch featured posts first (1 big + 4 small = 5 total)
        const featuredPosts = await payload.find({
          collection: 'posts',
          draft,
          limit: 5,
          sort: '-publishedAt',
          where: {
            _status: {
              equals: 'published'
            }
          },
          depth: 1,
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            heroImage: true,
            excerpt: true,
            categories: true,
          }
        })
        console.log('[Homepage] Featured posts fetched:', featuredPosts.docs.length)

        // Get IDs of featured posts to exclude them from recent posts
        const featuredPostIds = featuredPosts.docs.map(post => post.id)

        // Fetch recent posts (different from featured posts)
        const recentPosts = await payload.find({
          collection: 'posts',
          draft,
          limit: 6,
          sort: '-publishedAt',
          where: {
            _status: {
              equals: 'published'
            },
            id: {
              not_in: featuredPostIds
            }
          },
          depth: 1,
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            heroImage: true,
            excerpt: true,
            categories: true,
          }
        })
        console.log('[Homepage] Recent posts fetched:', recentPosts.docs.length)

        // Fetch categories
        const categories = await payload.find({
          collection: 'categories',
          draft,
          limit: 20,
          depth: 0,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
          }
        })
        console.log('[Homepage] Categories fetched:', categories.docs.length)

        // Return a simple homepage with the fetched data
        return (
          <div className="min-h-screen bg-white">
            {/* Bird Slideshow Section */}
            <div className="w-full">
              <BirdSlideshow />
            </div>

            {/* Bird Species Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-3xl font-bold mb-8 text-center">鳥の種類</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[
                  { name: 'オカメインコ', slug: 'cockatiel', icon: '/bird-icons/オカメインコ.webp' },
                  { name: '文鳥', slug: 'java-sparrow', icon: '/bird-icons/文鳥.webp' },
                  { name: 'セキセイインコ', slug: 'budgerigar', icon: '/bird-icons/セキセイインコ .webp' },
                  { name: 'コザクラインコ', slug: 'lovebird', icon: '/bird-icons/コザクラインコ .webp' },
                  { name: 'カナリア', slug: 'canary', icon: '/bird-icons/カナリア.webp' },
                  { name: 'フィンチ', slug: 'finch', icon: '/bird-icons/フィンチ.webp' },
                  { name: 'その他', slug: 'others', icon: '/bird-icons/その他.webp' },
                  { name: 'すべて', slug: 'all', icon: '/bird-icons/全て.webp' },
                ].map((bird) => (
                  <a
                    key={bird.slug}
                    href={`/birds/${bird.slug}`}
                    className="group block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="aspect-square relative bg-gradient-to-br from-orange-50 to-blue-50 p-4">
                      <img
                        src={bird.icon}
                        alt={bird.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                        {bird.name}
                      </h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Featured Posts Section */}
            {featuredPosts.docs.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-3xl font-bold mb-8">注目記事</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Large Featured Article */}
                  {featuredPosts.docs[0] && (
                    <article className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all border-4 border-orange-300 group">
                      <a href={`/posts/${featuredPosts.docs[0].slug}`} className="block">
                        {featuredPosts.docs[0].heroImage && typeof featuredPosts.docs[0].heroImage === 'object' && 'url' in featuredPosts.docs[0].heroImage && (
                          <div className="relative h-[400px] overflow-hidden">
                            <img
                              src={fixMediaUrl(featuredPosts.docs[0].heroImage.url)}
                              alt={featuredPosts.docs[0].heroImage.alt || featuredPosts.docs[0].title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute top-4 left-4">
                              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                ⭐ 注目記事
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="p-8 bg-white">
                          <h3 className="text-3xl font-bold mb-4 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {featuredPosts.docs[0].title}
                          </h3>
                          {featuredPosts.docs[0].excerpt && (
                            <p className="text-gray-700 text-lg mb-6 line-clamp-3">
                              {featuredPosts.docs[0].excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <time className="text-gray-500" dateTime={featuredPosts.docs[0].publishedAt}>
                              {new Date(featuredPosts.docs[0].publishedAt).toLocaleDateString('ja-JP')}
                            </time>
                            <span className="text-orange-600 font-semibold group-hover:underline">
                              続きを読む →
                            </span>
                          </div>
                        </div>
                      </a>
                    </article>
                  )}

                  {/* Small Featured Articles (4 articles in 2x2 grid) */}
                  <div className="lg:col-span-1 grid grid-cols-1 gap-4">
                    {featuredPosts.docs.slice(1, 5).map((post) => (
                      <article
                        key={post.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border-l-4 border-orange-400 group"
                      >
                        <a href={`/posts/${post.slug}`} className="flex gap-3 p-4">
                          {post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage && (
                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                              <img
                                src={fixMediaUrl(post.heroImage.url)}
                                alt={post.heroImage.alt || post.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                              {post.title}
                            </h4>
                            <time className="text-xs text-gray-500" dateTime={post.publishedAt}>
                              {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                            </time>
                          </div>
                        </a>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Posts Section */}
            {recentPosts.docs.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
                <h2 className="text-3xl font-bold mb-8">最新の記事</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentPosts.docs.map((post) => (
                    <article
                      key={post.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage && (
                        <div className="aspect-video bg-gray-200">
                          <img
                            src={fixMediaUrl(post.heroImage.url)}
                            alt={post.heroImage.alt || post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                          <a href={`/posts/${post.slug}`} className="hover:text-green-600">
                            {post.title}
                          </a>
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-600 line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString('ja-JP')}
                          </time>
                          <a
                            href={`/posts/${post.slug}`}
                            className="text-green-600 hover:underline"
                          >
                            続きを読む →
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* If no posts, show a message */}
            {recentPosts.docs.length === 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <p className="text-center text-gray-600">
                  記事がまだありません。
                </p>
              </div>
            )}
          </div>
        )
      } catch (error) {
        console.error('[Homepage] Error fetching data:', error)

        // Fallback to static content if database fails
        return (
          <div className="min-h-screen bg-white p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">🦜 Kawaii Bird Blog</h1>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-yellow-800">
                  データベースに接続中です。しばらくお待ちください...
                </p>
              </div>
              <p>NODE_ENV: {process.env.NODE_ENV}</p>
              <a href="/admin" className="text-blue-600 hover:underline">Admin Panel</a>
            </div>
          </div>
        )
      }
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
