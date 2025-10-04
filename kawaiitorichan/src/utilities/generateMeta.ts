import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args
  const serverUrl = getServerSideURL()

  const ogImage = getImageURL(doc?.meta?.image)

  const title = doc?.meta?.title
    ? doc?.meta?.title + ' | Golf Knowledge Hub'
    : 'Golf Knowledge Hub'

  // Build canonical URL
  let canonicalUrl = serverUrl
  if (doc?.slug) {
    const slugPath = Array.isArray(doc.slug) ? doc.slug.join('/') : doc.slug
    // Determine collection type for URL path
    const isPost = 'publishedAt' in doc || 'authors' in doc
    canonicalUrl = isPost
      ? `${serverUrl}/posts/${slugPath}`
      : `${serverUrl}/${slugPath}`
  }

  // Extract keywords
  const keywords = (doc as Partial<Post>)?.meta?.keywords

  return {
    title,
    description: doc?.meta?.description,
    keywords: keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ja-JP': canonicalUrl,
        'ja': canonicalUrl,
      },
    },
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: doc?.meta?.title || title,
            },
          ]
        : undefined,
      title,
      url: canonicalUrl,
      type: 'publishedAt' in doc ? 'article' : 'website',
      locale: 'ja_JP',
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description: doc?.meta?.description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}
