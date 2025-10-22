import type { Post, Page, Category, Media } from '@/payload-types'
import { getServerSideURL } from './getURL'
import { serializeRichTextToExcerpt, serializeRichTextToPlainText } from './serializeRichText'
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

export interface CollectionPageSchema {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description?: string
  url: string
  mainEntity: {
    '@type': 'ItemList'
    name: string
    description?: string
    numberOfItems: number
    itemListElement: {
      '@type': 'ListItem'
      position: number
      url: string
      name: string
      image?: string
    }[]
  }
  inLanguage?: string
  breadcrumb?: BreadcrumbSchema
}

export interface FAQSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: {
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }[]
}

export interface HowToSchema {
  '@context': 'https://schema.org'
  '@type': 'HowTo'
  name: string
  description?: string
  totalTime?: string
  step: {
    '@type': 'HowToStep'
    name?: string
    text: string
    position: number
  }[]
  image?: string
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

  // Calculate actual word count from content (not just estimate from reading time)
  let wordCount: number | undefined
  if (post.content) {
    const contentText = serializeRichTextToPlainText(post.content)
    // Count words more accurately - remove extra whitespace and count
    const words = contentText.trim().split(/\s+/).filter(w => w.length > 0)
    wordCount = words.length

    // Fallback to reading time estimate if word count is 0
    if (wordCount === 0) {
      wordCount = calculateReadingTime(post.content) * 200
    }
  }

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
      name: 'Kawaii Small Bird',
      logo: {
        '@type': 'ImageObject',
        url: `${serverUrl}/website-template-OG.webp`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    keywords: post.meta?.keywords || (articleSections.length > 0 ? articleSections.join(', ') : '小鳥, ペット, 飼育'),
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
    name: 'Kawaii Small Bird',
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
    name: 'Kawaii Small Bird',
    url: serverUrl,
    description: '小鳥の飼育、健康管理、種類に関する総合情報サイト',
    publisher: {
      '@type': 'Organization',
      name: 'Kawaii Small Bird',
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

/**
 * Generate CollectionPage schema for category pages
 */
export function generateCollectionPageSchema(
  category: Category,
  posts: Post[],
  breadcrumbSchema?: BreadcrumbSchema
): CollectionPageSchema {
  const serverUrl = getServerSideURL()
  const categoryUrl = `${serverUrl}/categories/${category.slug}`

  // Build item list from posts
  const itemListElement = posts.slice(0, 20).map((post, index) => {
    let imageUrl: string | undefined
    if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
      imageUrl = `${serverUrl}${post.heroImage.url}`
    }

    return {
      '@type': 'ListItem' as const,
      position: index + 1,
      url: `${serverUrl}/posts/${post.slug}`,
      name: post.title,
      image: imageUrl,
    }
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.title,
    description: category.description,
    url: categoryUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: `${category.title}の記事一覧`,
      description: `${category.title}に関する小鳥の情報`,
      numberOfItems: posts.length,
      itemListElement,
    },
    inLanguage: 'ja',
    breadcrumb: breadcrumbSchema,
  }
}

/**
 * Extract FAQ items from post content
 * Looks for Q&A patterns in Japanese (Q: or 質問: followed by A: or 回答:)
 */
export function extractFAQFromContent(content: any): FAQSchema | null {
  if (!content) return null

  const plainText = serializeRichTextToPlainText(content)
  const faqs: FAQSchema['mainEntity'] = []

  // Pattern 1: Q: ... A: ...
  // Pattern 2: 質問: ... 回答: ... or 答え: ...
  // Pattern 3: Question headers followed by answers
  const qaPairs = plainText.split(/(?=Q:|質問:|Q\d+|質問\d+)/i)

  for (const pair of qaPairs) {
    // Try to extract question and answer
    const qMatch = pair.match(/(?:Q:|質問:|Question:|Q\d+:|質問\d+:)\s*(.+?)(?=A:|回答:|答え:|Answer:|A\d+:|回答\d+:|$)/is)
    const aMatch = pair.match(/(?:A:|回答:|答え:|Answer:|A\d+:|回答\d+:)\s*(.+?)(?=Q:|質問:|$)/is)

    if (qMatch && aMatch) {
      const question = qMatch[1].trim()
      const answer = aMatch[1].trim()

      if (question.length > 5 && answer.length > 5) {
        faqs.push({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })
      }
    }
  }

  // Only return FAQ schema if we found at least 2 Q&A pairs
  if (faqs.length >= 2) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs,
    }
  }

  return null
}

/**
 * Extract HowTo steps from post content
 * Looks for numbered steps or step-by-step patterns
 */
export function extractHowToFromContent(post: Post): HowToSchema | null {
  if (!post.content) return null

  const plainText = serializeRichTextToPlainText(post.content)
  const steps: HowToSchema['step'] = []

  // Pattern 1: ステップ1, ステップ2, etc.
  // Pattern 2: 手順1, 手順2, etc.
  // Pattern 3: 1. ... 2. ... 3. ...
  // Pattern 4: Step 1, Step 2, etc.

  // Split by step markers
  const stepMarkers = /(?:ステップ|手順|Step|STEP)\s*(\d+)|^(\d+)\.\s+/gim
  const parts = plainText.split(stepMarkers)

  let stepPosition = 1
  for (let i = 1; i < parts.length; i += 3) {
    const stepNumber = parts[i] || parts[i + 1]
    const stepContent = parts[i + 2]?.trim()

    if (stepContent && stepContent.length > 10) {
      // Extract step name (first sentence) and text (rest)
      const sentences = stepContent.split(/[。.]/);
      const stepName = sentences[0]?.trim()
      const stepText = stepContent

      steps.push({
        '@type': 'HowToStep',
        name: stepName || `Step ${stepPosition}`,
        text: stepText,
        position: stepPosition,
      })
      stepPosition++
    }
  }

  // Only return HowTo schema if we found at least 3 steps
  if (steps.length >= 3) {
    const serverUrl = getServerSideURL()
    let imageUrl: string | undefined
    if (post.heroImage && typeof post.heroImage === 'object' && 'url' in post.heroImage) {
      imageUrl = `${serverUrl}${post.heroImage.url}`
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: post.title,
      description: post.meta?.description || serializeRichTextToExcerpt(post.excerpt, 160),
      step: steps,
      image: imageUrl,
    }
  }

  return null
}
