import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const serverUrl = getServerSideURL()
  const payload = await getPayload({ config })

  try {
    // Fetch all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 10000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-updatedAt',
      depth: 0,
    })

    // Fetch all published pages
    const { docs: pages } = await payload.find({
      collection: 'pages',
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-updatedAt',
      depth: 0,
    })

    // Fetch all categories
    const { docs: categories } = await payload.find({
      collection: 'categories',
      limit: 1000,
      pagination: false,
      depth: 0,
    })

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${serverUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Posts -->
${posts
  .map((post) => {
    const lastmod = post.updatedAt || post.publishedAt || post.createdAt
    return `  <url>
    <loc>${serverUrl}/posts/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  })
  .join('\n')}

  <!-- Pages -->
${pages
  .filter((page) => page.slug !== 'home')
  .map((page) => {
    const lastmod = page.updatedAt || page.createdAt
    return `  <url>
    <loc>${serverUrl}/${page.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
  })
  .join('\n')}

  <!-- Categories -->
${categories
  .map((category) => {
    const lastmod = category.updatedAt || category.createdAt
    return `  <url>
    <loc>${serverUrl}/categories/${category.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  })
  .join('\n')}
</urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

// Skip pre-rendering during build, but cache at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 3600
