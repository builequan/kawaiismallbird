import type { Post, Page, Category, Media } from '@/payload-types'
import { getServerSideURL } from './getURL'
import { serializeRichTextToExcerpt, serializeRichTextToPlainText, serializeRichTextToFullText } from './serializeRichText'
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
  description?: string
  logo?: {
    '@type': 'ImageObject'
    url: string
    width?: number
    height?: number
  }
  sameAs?: string[]
  inLanguage?: string
  foundingDate?: string
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

export interface AnimalSchema {
  '@context': 'https://schema.org'
  '@type': 'Animal'
  name: string
  alternateName?: string[]
  description?: string
  image?: string
  sameAs?: string[]
  additionalProperty?: {
    '@type': 'PropertyValue'
    name: string
    value: string
  }[]
}

export interface BirdSpeciesPageSchema {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  description?: string
  url: string
  about: AnimalSchema
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
  breadcrumb?: BreadcrumbSchema
  inLanguage?: string
}

export interface BirdData {
  name: string
  englishName: string
  scientificName?: string
  image: string
  searchTerms: string[]
  description: string
  basicInfo: {
    origin: string
    lifespan: string
    size: string
    weight: string
  }
  characteristics: string[]
  careTips: string[]
  // Extended entity attributes for SEO
  extendedInfo?: {
    dietType?: string
    noiseLevel?: string
    careLevel?: string
    apartmentSuitable?: string
    socialNeeds?: string
    talkingAbility?: string
    colors?: string[]
    wikipediaUrl?: string
  }
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
  // If no authors populated, use the organization as author (Google-compliant fallback)
  let authors: ArticleSchema['author']
  if (post.populatedAuthors && post.populatedAuthors.length > 0) {
    authors = post.populatedAuthors.map((author) => ({
      '@type': 'Person' as const,
      name: author.name || 'Anonymous',
    }))
  } else {
    // Use Organization as author when no individual author is specified
    // This is a valid approach per Google's author markup guidelines
    authors = [{
      '@type': 'Organization' as const,
      name: 'Kawaii Small Bird',
    }]
  }

  // Convert excerpt from RichText to plain text for description
  // Priority: meta.description > excerpt > content (first paragraph)
  let description: string | undefined = post.meta?.description
  if (!description && post.excerpt) {
    description = serializeRichTextToExcerpt(post.excerpt, 160)
  }
  // Fallback to content if no description yet
  if (!description && post.content) {
    description = serializeRichTextToExcerpt(post.content, 160)
  }
  // Final fallback: use title with site context
  if (!description) {
    description = `${post.title} - 小鳥の飼育情報`
  }

  // Calculate actual word count from content using full text extraction
  // Japanese text: count characters (excluding spaces) as word count is not meaningful
  // Mixed content: use character count / 2 as approximation for Japanese
  let wordCount: number | undefined
  if (post.content) {
    const contentText = serializeRichTextToFullText(post.content)

    // For Japanese content, character count is more meaningful than word count
    // Japanese averages ~2 characters per "word" equivalent
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(contentText)

    if (hasJapanese) {
      // Count non-whitespace characters for Japanese text
      const charCount = contentText.replace(/\s/g, '').length
      // Use character count as word count (standard for Japanese SEO)
      wordCount = charCount
    } else {
      // For non-Japanese content, count words normally
      const words = contentText.trim().split(/\s+/).filter(w => w.length > 0)
      wordCount = words.length
    }

    // Fallback to reading time estimate if word count is still 0
    if (!wordCount || wordCount === 0) {
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
 * Enhanced with additional recommended properties for better Google entity recognition
 */
export function generateOrganizationSchema(): OrganizationSchema {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kawaii Small Bird',
    url: serverUrl,
    description: '小鳥の飼育、健康管理、種類に関する総合情報サイト。セキセイインコ、オカメインコ、文鳥など、様々な小鳥の飼い方を詳しく解説します。',
    logo: {
      '@type': 'ImageObject',
      url: `${serverUrl}/website-template-OG.webp`,
      width: 1200,
      height: 630,
    },
    inLanguage: 'ja',
    foundingDate: '2024',
  }
}

/**
 * Generate WebSite schema
 * Note: SearchAction (sitelinks search box) was deprecated by Google in November 2024
 */
export function generateWebSiteSchema(): WebSiteSchema {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kawaii Small Bird',
    url: serverUrl,
    description: '小鳥の飼育、健康管理、種類に関する総合情報サイト。セキセイインコ、オカメインコ、文鳥など、様々な小鳥の飼い方を詳しく解説します。',
    publisher: {
      '@type': 'Organization',
      name: 'Kawaii Small Bird',
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
 * Helper function to extract text from a Lexical node recursively
 */
function extractTextFromNode(node: any): string {
  if (!node) return ''

  if (node.type === 'text' && node.text) {
    return node.text
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join('')
  }

  return ''
}

/**
 * Extract FAQ items from post content
 * Looks for Q&A patterns in Japanese and question-style headings
 * Enhanced for entity-oriented SEO to capture common FAQ patterns
 */
export function extractFAQFromContent(content: any): FAQSchema | null {
  if (!content) return null

  const plainText = serializeRichTextToPlainText(content)
  const faqs: FAQSchema['mainEntity'] = []

  // Pattern 1: Explicit Q&A format (Q: ... A: ...)
  const qaPairs = plainText.split(/(?=Q:|質問:|Q\d+|質問\d+)/i)

  for (const pair of qaPairs) {
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
            text: answer.slice(0, 500), // Limit answer length for schema
          },
        })
      }
    }
  }

  // Pattern 2: Question-style headings (Japanese patterns)
  // Common patterns: "〜とは？", "〜ですか？", "〜の方法", "〜のコツ", "なぜ〜", "どうすれば〜"
  const questionPatterns = [
    // "〜とは？" - "What is ~?"
    /(.+?とは[？?])\s*\n+(.+?)(?=\n\n|\n(?:[^\n]+とは[？?])|$)/gs,
    // "〜ですか？" / "〜ますか？" - Question ending
    /(.+?(?:です|ます)か[？?])\s*\n+(.+?)(?=\n\n|\n(?:[^\n]+(?:です|ます)か[？?])|$)/gs,
    // "なぜ〜" / "どうして〜" - "Why ~?"
    /((?:なぜ|どうして).+?[？?])\s*\n+(.+?)(?=\n\n|\n(?:(?:なぜ|どうして).+?[？?])|$)/gs,
    // "どうすれば〜" / "どうやって〜" - "How to ~?"
    /((?:どうすれば|どうやって|どのように).+?[？?])\s*\n+(.+?)(?=\n\n|$)/gs,
    // "〜の原因" / "〜の理由" - "Cause of ~" / "Reason for ~"
    /(.+?の(?:原因|理由)[は]?[？?]?)\s*\n+(.+?)(?=\n\n|$)/gs,
    // "〜の対策" / "〜の方法" / "〜のやり方" - "How to deal with ~"
    /(.+?の(?:対策|方法|やり方|コツ|ポイント)[は]?[？?]?)\s*\n+(.+?)(?=\n\n|$)/gs,
  ]

  for (const pattern of questionPatterns) {
    let match
    while ((match = pattern.exec(plainText)) !== null) {
      const question = match[1].trim()
      const answer = match[2].trim()

      // Validate question and answer
      if (
        question.length >= 8 &&
        question.length <= 200 &&
        answer.length >= 20 &&
        // Avoid duplicates
        !faqs.some(faq => faq.name === question)
      ) {
        faqs.push({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer.slice(0, 500), // Limit answer length
          },
        })
      }
    }
  }

  // Pattern 3: Look for Lexical content with heading nodes that are questions
  if (content?.root?.children) {
    const extractQuestionsFromLexical = (children: any[]): void => {
      for (let i = 0; i < children.length; i++) {
        const node = children[i]

        // Check if this is a heading node with question-like text
        if (node.type === 'heading' && node.tag && ['h2', 'h3'].includes(node.tag)) {
          const headingText = extractTextFromNode(node)

          // Check if heading ends with ? or Japanese question markers
          if (headingText && /[？?]$/.test(headingText)) {
            // Look for the next paragraph(s) as the answer
            let answerText = ''
            for (let j = i + 1; j < children.length && j < i + 4; j++) {
              const nextNode = children[j]
              if (nextNode.type === 'heading') break // Stop at next heading
              const text = extractTextFromNode(nextNode)
              if (text) {
                answerText += (answerText ? ' ' : '') + text
              }
            }

            if (
              headingText.length >= 8 &&
              answerText.length >= 20 &&
              !faqs.some(faq => faq.name === headingText)
            ) {
              faqs.push({
                '@type': 'Question',
                name: headingText,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: answerText.slice(0, 500),
                },
              })
            }
          }
        }

        // Recursively check children
        if (node.children) {
          extractQuestionsFromLexical(node.children)
        }
      }
    }

    extractQuestionsFromLexical(content.root.children)
  }

  // Only return FAQ schema if we found at least 2 Q&A pairs
  if (faqs.length >= 2) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.slice(0, 10), // Limit to 10 FAQs for schema
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

/**
 * Generate comprehensive structured data for bird species pages
 * Includes Animal entity schema with detailed attributes for entity-oriented SEO
 */
export function generateBirdSpeciesPageSchema(
  bird: BirdData,
  slug: string,
  posts: Post[]
): BirdSpeciesPageSchema {
  const serverUrl = getServerSideURL()
  const pageUrl = `${serverUrl}/birds/${slug}`

  // Build Animal entity schema with all available attributes
  const additionalProperties: AnimalSchema['additionalProperty'] = [
    { '@type': 'PropertyValue', name: '原産地', value: bird.basicInfo.origin },
    { '@type': 'PropertyValue', name: '寿命', value: bird.basicInfo.lifespan },
    { '@type': 'PropertyValue', name: '体長', value: bird.basicInfo.size },
    { '@type': 'PropertyValue', name: '体重', value: bird.basicInfo.weight },
  ]

  // Add extended attributes if available
  if (bird.extendedInfo) {
    if (bird.extendedInfo.dietType) {
      additionalProperties.push({ '@type': 'PropertyValue', name: '食性', value: bird.extendedInfo.dietType })
    }
    if (bird.extendedInfo.noiseLevel) {
      additionalProperties.push({ '@type': 'PropertyValue', name: '鳴き声レベル', value: bird.extendedInfo.noiseLevel })
    }
    if (bird.extendedInfo.careLevel) {
      additionalProperties.push({ '@type': 'PropertyValue', name: '飼育難易度', value: bird.extendedInfo.careLevel })
    }
    if (bird.extendedInfo.apartmentSuitable) {
      additionalProperties.push({ '@type': 'PropertyValue', name: 'マンション適性', value: bird.extendedInfo.apartmentSuitable })
    }
    if (bird.extendedInfo.socialNeeds) {
      additionalProperties.push({ '@type': 'PropertyValue', name: '社会性', value: bird.extendedInfo.socialNeeds })
    }
    if (bird.extendedInfo.talkingAbility) {
      additionalProperties.push({ '@type': 'PropertyValue', name: 'おしゃべり能力', value: bird.extendedInfo.talkingAbility })
    }
  }

  // Build alternate names array
  const alternateName = [bird.englishName, ...bird.searchTerms.filter(t => t !== bird.name && t !== bird.englishName)]
  if (bird.scientificName) {
    alternateName.push(bird.scientificName)
  }

  // Build sameAs links (Wikipedia, etc.)
  const sameAs: string[] = []
  if (bird.extendedInfo?.wikipediaUrl) {
    sameAs.push(bird.extendedInfo.wikipediaUrl)
  }

  // Animal entity schema
  const animalSchema: AnimalSchema = {
    '@context': 'https://schema.org',
    '@type': 'Animal',
    name: bird.name,
    alternateName: alternateName.length > 0 ? alternateName : undefined,
    description: bird.description,
    image: `${serverUrl}${bird.image}`,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    additionalProperty: additionalProperties,
  }

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

  // Breadcrumb schema
  const breadcrumbSchema: BreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: serverUrl },
      { '@type': 'ListItem', position: 2, name: '鳥の種類', item: `${serverUrl}/#bird-types` },
      { '@type': 'ListItem', position: 3, name: bird.name, item: pageUrl },
    ],
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${bird.name}の飼い方・特徴・関連記事`,
    description: `${bird.name}（${bird.englishName}）の基本情報、特徴、飼育方法を詳しく解説。${bird.description}`,
    url: pageUrl,
    about: animalSchema,
    mainEntity: {
      '@type': 'ItemList',
      name: `${bird.name}の関連記事`,
      description: `${bird.name}に関する飼育情報、健康管理、お世話のコツ`,
      numberOfItems: posts.length,
      itemListElement,
    },
    breadcrumb: breadcrumbSchema,
    inLanguage: 'ja',
  }
}
