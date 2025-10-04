import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Image sitemap for SEO
 * Generates XML sitemap with all images from posts
 * Accessible at /image-sitemap.xml
 */
export async function GET() {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

    // Get all published posts with hero images (depth: 2 to get alt text)
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
        title: true,
        heroImage: true,
        heroImageAlt: true,
      },
      depth: 2, // Increased depth to get heroImage.alt
    })

    // Build image sitemap XML
    const images = posts
      .filter((post) => post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage)
      .map((post) => {
        const heroImage = post.heroImage as any

        // Use heroImageAlt field or fall back to heroImage.alt
        const altText = post.heroImageAlt || heroImage.alt || post.title

        return {
          loc: `${serverUrl}/posts/${post.slug}`,
          image: {
            loc: `${serverUrl}${heroImage.url}`,
            title: post.title,
            caption: altText,
          },
        }
      })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <image:image>
      <image:loc>${item.image.loc}</image:loc>
      <image:title>${escapeXml(item.image.title)}</image:title>
      <image:caption>${escapeXml(item.image.caption)}</image:caption>
    </image:image>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating image sitemap:', error)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
