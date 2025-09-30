import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import React from 'react'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function SimplePage({ params: paramsPromise }: Args) {
  try {
    const { isEnabled: draft } = await draftMode()
    const { slug = 'home' } = await paramsPromise

    // Simple homepage - start with just static HTML
    if (slug === 'home') {
      // Start with super simple static test
      const isStaticTest = true

      if (isStaticTest) {
        return (
          <div className="min-h-screen bg-white p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-8">🦜 Kawaii Bird Blog - Static Test</h1>
              <p>This page loads without any database queries.</p>
              <p>If you see this, the website is working!</p>
              <p>NODE_ENV: {process.env.NODE_ENV}</p>
              <a href="/admin" className="text-blue-600 hover:underline">Admin Panel</a>
            </div>
          </div>
        )
      }

      const payload = await getPayload({ config: configPromise })

      // Get posts count
      const postCount = await payload.count({
        collection: 'posts',
        where: {
          _status: {
            equals: 'published'
          }
        }
      })

      // Get categories count
      const categoryCount = await payload.count({
        collection: 'categories'
      })

      // Get a few recent posts with minimal data
      const recentPosts = await payload.find({
        collection: 'posts',
        draft,
        limit: 10,
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
        }
      })

      return (
        <div className="min-h-screen bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">🦜 Kawaii Bird Blog</h1>

            <div className="mb-8 p-4 bg-green-50 rounded-lg">
              <p className="text-lg">
                Total Posts: <strong>{postCount.totalDocs}</strong>
              </p>
              <p className="text-lg">
                Total Categories: <strong>{categoryCount.totalDocs}</strong>
              </p>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
            <ul className="space-y-2">
              {recentPosts.docs.map((post) => (
                <li key={post.id} className="border-b pb-2">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="text-gray-500 ml-2 text-sm">
                    ({new Date(post.publishedAt).toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>

            {recentPosts.docs.length === 0 && (
              <p className="text-gray-500">No posts found.</p>
            )}
          </div>
        </div>
      )
    }

    return <div>Page not found</div>
  } catch (error) {
    console.error('Simple page error:', error)
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
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
  return {
    title: 'Kawaii Bird Blog',
    description: 'A blog about birds'
  }
}