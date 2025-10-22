import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Image sitemap for SEO
 * Helps search engines discover and index images
 */
export async function GET() {
  const serverUrl = getServerSideURL()

  try {
    const payload = await getPayload({ config })

    // Get all published posts with hero images
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
    })

    // Build XML content
    let xmlContent = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
\`

    for (const post of posts) {
      if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
        const postUrl = \`\${serverUrl}/posts/\${post.slug}\`
        const imageUrl = \`\${serverUrl}\${post.heroImage.url}\`.replace('/api/media/file/', '/media/')
        const imageTitle = post.title
        const imageCaption = post.heroImageAlt || post.title

        xmlContent += \`  <url>
    <loc>\${postUrl}</loc>
    <image:image>
      <image:loc>\${imageUrl}</image:loc>
      <image:title>\${escapeXml(imageTitle)}</image:title>
      <image:caption>\${escapeXml(imageCaption)}</image:caption>
    </image:image>
  </url>
\`
      }
    }

    xmlContent += \`</urlset>\`

    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating image sitemap:', error)
    // Return minimal sitemap on error
    const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>\`
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Skip pre-rendering during build
export const dynamic = 'force-dynamic'
export const revalidate = 3600
