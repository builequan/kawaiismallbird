import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

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

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .filter((page) => page.slug !== 'home')
  .map((page) => {
    const slugPath = Array.isArray(page.slug) ? page.slug.join('/') : page.slug
    const lastMod = page.updatedAt ? new Date(page.updatedAt).toISOString() : ''
    return `  <url>
    <loc>${serverUrl}/${slugPath}</loc>${lastMod ? `\n    <lastmod>${lastMod}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
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
    console.error('Error generating pages sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

export const revalidate = 3600
