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
      `${serverUrl}/sitemap.xml`,
      `${serverUrl}/image-sitemap.xml`,
    ],
    host: serverUrl,
  }
}
