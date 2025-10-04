import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Main combined sitemap with all pages, posts, and categories
 * Next.js 15 will automatically generate sitemap.xml from this
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

    // Get all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 10000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
    })

    // Get all categories
    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 1000,
      pagination: false,
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    // Get all published pages
    const { docs: pages } = await payload.find({
      collection: 'pages',
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const sitemap: MetadataRoute.Sitemap = [
      // Homepage
      {
        url: serverUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      // Categories index
      {
        url: `${serverUrl}/categories`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      // All posts
      ...posts.map((post) => ({
        url: `${serverUrl}/posts/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt ? new Date(post.updatedAt || post.publishedAt) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
      // All categories
      ...categories.map((category) => ({
        url: `${serverUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      // All pages (excluding home)
      ...pages
        .filter((page) => page.slug !== 'home')
        .map((page) => ({
          url: `${serverUrl}/${Array.isArray(page.slug) ? page.slug.join('/') : page.slug}`,
          lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        })),
    ]

    return sitemap
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return minimal sitemap on error
    return [
      {
        url: serverUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
