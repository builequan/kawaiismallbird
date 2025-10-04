import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

    // Get all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 50000,
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

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts
  .map((post) => {
    const lastMod =
      post.updatedAt || post.publishedAt
        ? new Date(post.updatedAt || post.publishedAt).toISOString()
        : ''
    return `  <url>
    <loc>${serverUrl}/posts/${post.slug}</loc>${lastMod ? `\n    <lastmod>${lastMod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
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
    console.error('Error generating posts sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600
