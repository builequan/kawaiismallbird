import { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const serverUrl = getServerSideURL()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [
      `${serverUrl}/sitemap-index.xml`,
      `${serverUrl}/sitemap.xml`,
      `${serverUrl}/posts-sitemap.xml`,
      `${serverUrl}/categories-sitemap.xml`,
      `${serverUrl}/pages-sitemap.xml`,
      `${serverUrl}/image-sitemap.xml`,
      `${serverUrl}/feed.xml`,
    ],
    host: serverUrl,
  }
}
