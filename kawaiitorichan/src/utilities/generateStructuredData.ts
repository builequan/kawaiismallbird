import type { Post, Page, Category, Media } from '@/payload-types'
import { getServerSideURL } from './getURL'
import { serializeRichTextToExcerpt } from './serializeRichText'
import { calculateReadingTime } from './calculateReadingTime'

export interface ArticleSchema {
  '@context': 'https://schema.org'
  '@type': 'Article' | 'BlogPosting'
  headline: string
  description?: string
  image?: string | string[]
  datePublished?: string
  dateModified?: string
  author?: {
    '@type': 'Person' | 'Organization'
    name: string
  }[]
  publisher?: {
    '@type': 'Organization'
    name: string
    logo?: {
      '@type': 'ImageObject'
      url: string
    }
  }
  mainEntityOfPage?: {
    '@type': 'WebPage'
    '@id': string
  }
  keywords?: string
  articleSection?: string[]
  wordCount?: number
  inLanguage?: string
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: {
    '@type': 'ListItem'
    position: number
    name: string
    item?: string
  }[]
}

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo?: {
    '@type': 'ImageObject'
    url: string
  }
  sameAs?: string[]
}

export interface WebSiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  url: string
  description?: string
  publisher?: {
    '@type': 'Organization'
    name: string
  }
  potentialAction?: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
  inLanguage?: string
}

/**
 * Generate Article/BlogPosting schema for a post
 */
export function generateArticleSchema(post: Post): ArticleSchema {
  const serverUrl = getServerSideURL()
  const postUrl = `${serverUrl}/posts/${post.slug}`

  // Extract hero image URL
  let imageUrl: string | undefined
  if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
    imageUrl = `${serverUrl}${post.heroImage.url}`
  } else if (post.meta?.image && typeof post.meta.image === 'object' && 'url' in post.meta.image) {
    imageUrl = `${serverUrl}${post.meta.image.url}`
  }

  // Extract categories for articleSection
  const articleSections: string[] = []
  if (post.categories && Array.isArray(post.categories)) {
    post.categories.forEach((cat) => {
      if (typeof cat === 'object' && 'title' in cat && cat.title) {
        articleSections.push(cat.title)
      }
    })
  }

  // Extract author information
  const authors = post.populatedAuthors?.map((author) => ({
    '@type': 'Person' as const,
    name: author.name || 'Anonymous',
  })) || [{
    '@type': 'Person' as const,
    name: 'Golf Expert',
  }]

  // Convert excerpt from RichText to plain text
  let description: string | undefined = post.meta?.description
  if (!description && post.excerpt) {
    description = serializeRichTextToExcerpt(post.excerpt, 160)
  }

  // Calculate word count from content
  const wordCount = post.content ? calculateReadingTime(post.content) * 200 : undefined

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: imageUrl,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: authors,
    publisher: {
      '@type': 'Organization',
      name: 'Golf Knowledge Hub',
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/website-template-OG.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: post.meta?.keywords || articleSections.join(', '),
    articleSection: articleSections.length > 0 ? articleSections : undefined,
    wordCount,
    inLanguage: post.language || 'ja',
  }

  return schema
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { name: string; url?: string }[]): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate breadcrumb items for a post
 */
export function generatePostBreadcrumbs(post: Post): { name: string; url?: string }[] {
  const serverUrl = getServerSideURL()
  const breadcrumbs: { name: string; url?: string }[] = [
    { name: 'ホーム', url: serverUrl },
  ]

  // Add primary category if exists
  if (post.categories && Array.isArray(post.categories) && post.categories.length > 0) {
    const primaryCategory = post.categories[0]
    if (typeof primaryCategory === 'object' && 'title' in primaryCategory && 'slug' in primaryCategory) {
      breadcrumbs.push({
        name: primaryCategory.title,
        url: `${serverUrl}/categories/${primaryCategory.slug}`,
      })
    }
  }

  // Add current post WITH URL (Google recommends including URL for current page too)
  breadcrumbs.push({
    name: post.title,
    url: `${serverUrl}/posts/${post.slug}`
  })

  return breadcrumbs
}

/**
 * Generate breadcrumb items for a category
 */
export function generateCategoryBreadcrumbs(
  category: Category,
  parentCategory?: Category
): { name: string; url?: string }[] {
  const serverUrl = getServerSideURL()
  const breadcrumbs: { name: string; url?: string }[] = [
    { name: 'ホーム', url: serverUrl },
    { name: 'カテゴリー', url: `${serverUrl}/categories` },
  ]

  // Add parent category if exists
  if (parentCategory) {
    breadcrumbs.push({
      name: parentCategory.title,
      url: `${serverUrl}/categories/${parentCategory.slug}`,
    })
  }

  // Add current category WITH URL (Google recommends including URL for current page too)
  breadcrumbs.push({
    name: category.title,
    url: `${serverUrl}/categories/${category.slug}`
  })

  return breadcrumbs
}

/**
 * Generate Organization schema for the site
 */
export function generateOrganizationSchema(): OrganizationSchema {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Golf Knowledge Hub',
    url: serverUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${serverUrl}/website-template-OG.webp`,
    },
  }
}

/**
 * Generate WebSite schema with search box
 */
export function generateWebSiteSchema(): WebSiteSchema {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Golf Knowledge Hub',
    url: serverUrl,
    description: 'ゴルフの知識、技術、機器に関する総合情報サイト',
    publisher: {
      '@type': 'Organization',
      name: 'Golf Knowledge Hub',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${serverUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'ja',
  }
}
