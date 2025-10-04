import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

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

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories
  .map((category) => {
    const lastMod = category.updatedAt ? new Date(category.updatedAt).toISOString() : ''
    return `  <url>
    <loc>${serverUrl}/categories/${category.slug}</loc>${lastMod ? `\n    <lastmod>${lastMod}</lastmod>` : ''}
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
    console.error('Error generating categories sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600
