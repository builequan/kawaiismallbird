import { getPayload } from 'payload'
import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const serverUrl = getServerSideURL()
  const payload = await getPayload({ config })

  try {
    // Get latest 50 published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 50,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishedAt',
      depth: 0,
    })

    // Generate RSS feed
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Golf Knowledge Hub - ゴルフ総合情報サイト</title>
    <link>${serverUrl}</link>
    <description>ゴルフの知識、技術、機器に関する総合情報サイト</description>
    <language>ja-JP</language>
    <atom:link href="${serverUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts
  .map((post) => {
    const postUrl = `${serverUrl}/posts/${post.slug}`
    const pubDate = post.publishedAt || post.createdAt
    const description = post.meta?.description || ''

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`
  })
  .join('\n')}
  </channel>
</rss>`

    return new Response(feed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}

export const revalidate = 3600 // Revalidate every hour
