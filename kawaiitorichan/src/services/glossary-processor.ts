/**
 * Glossary Processor Service
 * Extracts terms from posts and creates glossary entries
 */

import { getPayload, Payload } from 'payload'
import configPromise from '@payload-config'
import { extractTerms, generateDefinition, categorizeterm } from './openrouter'
import { fetchWikipediaDefinition } from './wikipedia'

interface ProcessingResult {
  postId: number | string
  postTitle: string
  newTerms: number
  linkedTerms: number
  errors: string[]
}

interface ProcessingProgress {
  current: number
  total: number
  currentPost: string
  status: string
}

type ProgressCallback = (progress: ProcessingProgress) => void

/**
 * Extract plain text from Lexical content
 */
function extractTextFromLexical(content: any): string {
  if (!content || !content.root) return ''

  const extractText = (node: any): string => {
    if (!node) return ''

    // Text node
    if (node.type === 'text' && node.text) {
      return node.text
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join(' ')
    }

    return ''
  }

  return extractText(content.root).replace(/\s+/g, ' ').trim()
}

/**
 * Get all existing glossary terms
 */
async function getExistingTerms(payload: Payload): Promise<Map<string, number>> {
  const glossary = await payload.find({
    collection: 'glossary',
    limit: 10000,
    pagination: false,
    select: {
      term: true,
    },
  })

  const termMap = new Map<string, number>()
  for (const entry of glossary.docs) {
    termMap.set(entry.term, entry.id as number)
  }

  return termMap
}

/**
 * Process a single post and extract/create glossary terms
 */
export async function processPost(
  postId: number | string,
  payload?: Payload
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    postId,
    postTitle: '',
    newTerms: 0,
    linkedTerms: 0,
    errors: [],
  }

  try {
    if (!payload) {
      payload = await getPayload({ config: configPromise })
    }

    // Fetch the post
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })

    if (!post) {
      result.errors.push(`Post ${postId} not found`)
      return result
    }

    result.postTitle = post.title || `Post ${postId}`

    // Extract text from content
    const textContent = extractTextFromLexical(post.content)

    if (!textContent || textContent.length < 50) {
      result.errors.push('Post has insufficient content')
      return result
    }

    // Get existing terms
    const existingTerms = await getExistingTerms(payload)
    const existingTermsList = Array.from(existingTerms.keys())

    // Extract terms using LLM
    const extractedTerms = await extractTerms(textContent, existingTermsList, 20)

    if (extractedTerms.length === 0) {
      return result
    }

    // Process each term
    for (const termData of extractedTerms) {
      try {
        // Check if term already exists
        const existingId = existingTerms.get(termData.term)

        if (existingId) {
          // Term exists - add this post to its references
          const existingEntry = await payload.findByID({
            collection: 'glossary',
            id: existingId,
          })

          const currentPosts = (existingEntry.posts || []).map((p: any) =>
            typeof p === 'object' ? p.id : p
          )

          if (!currentPosts.includes(Number(postId))) {
            await payload.update({
              collection: 'glossary',
              id: existingId,
              data: {
                posts: [...currentPosts, Number(postId)],
              },
            })
            result.linkedTerms++
          }
        } else {
          // New term - try Wikipedia first, then LLM
          let definition = ''
          let source: 'wikipedia' | 'llm' = 'llm'
          let wikipediaUrl = ''

          // Try Wikipedia
          const wikiResult = await fetchWikipediaDefinition(termData.term)

          if (wikiResult) {
            definition = wikiResult.definition
            source = 'wikipedia'
            wikipediaUrl = wikiResult.url
          } else {
            // Fall back to LLM
            definition = await generateDefinition(termData.term, textContent.substring(0, 500))
          }

          if (!definition || definition.length < 10) {
            result.errors.push(`Could not generate definition for: ${termData.term}`)
            continue
          }

          // Determine category
          const category = termData.category || await categorizeterm(termData.term, definition)

          // Create glossary entry
          await payload.create({
            collection: 'glossary',
            data: {
              term: termData.term,
              reading: termData.reading,
              definition,
              source,
              wikipediaUrl: wikipediaUrl || undefined,
              posts: [Number(postId)],
              category,
            },
          })

          result.newTerms++

          // Add to existing terms map to prevent duplicates in same batch
          existingTerms.set(termData.term, -1) // Use -1 as placeholder
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (termError: any) {
        result.errors.push(`Error processing term "${termData.term}": ${termError.message}`)
      }
    }
  } catch (error: any) {
    result.errors.push(`Error processing post: ${error.message}`)
  }

  return result
}

/**
 * Process multiple posts in batch
 */
export async function processPosts(
  postIds: (number | string)[],
  onProgress?: ProgressCallback
): Promise<ProcessingResult[]> {
  const payload = await getPayload({ config: configPromise })
  const results: ProcessingResult[] = []

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i]

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: postIds.length,
        currentPost: `Processing post ${postId}...`,
        status: 'processing',
      })
    }

    const result = await processPost(postId, payload)
    results.push(result)

    // Log progress
    console.log(
      `[${i + 1}/${postIds.length}] ${result.postTitle}: ${result.newTerms} new, ${result.linkedTerms} linked`
    )

    // Small delay between posts
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

/**
 * Process all published posts
 */
export async function processAllPosts(
  onProgress?: ProgressCallback,
  batchSize: number = 10
): Promise<{
  results: ProcessingResult[]
  totalNewTerms: number
  totalLinkedTerms: number
  totalErrors: number
}> {
  const payload = await getPayload({ config: configPromise })

  // Get all published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000,
    pagination: false,
    select: {
      id: true,
      title: true,
    },
  })

  const postIds = posts.docs.map(p => p.id)
  console.log(`Found ${postIds.length} posts to process`)

  const results: ProcessingResult[] = []
  let totalNewTerms = 0
  let totalLinkedTerms = 0
  let totalErrors = 0

  // Process in batches
  for (let i = 0; i < postIds.length; i += batchSize) {
    const batch = postIds.slice(i, i + batchSize)

    if (onProgress) {
      onProgress({
        current: i,
        total: postIds.length,
        currentPost: `Processing batch ${Math.floor(i / batchSize) + 1}...`,
        status: 'processing',
      })
    }

    const batchResults = await processPosts(batch)
    results.push(...batchResults)

    for (const result of batchResults) {
      totalNewTerms += result.newTerms
      totalLinkedTerms += result.linkedTerms
      totalErrors += result.errors.length
    }

    // Delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return {
    results,
    totalNewTerms,
    totalLinkedTerms,
    totalErrors,
  }
}

/**
 * Get glossary terms for a specific post
 */
export async function getGlossaryTermsForPost(
  postId: number | string
): Promise<Array<{ term: string; reading: string; definition: string }>> {
  const payload = await getPayload({ config: configPromise })

  const glossary = await payload.find({
    collection: 'glossary',
    where: {
      posts: {
        contains: Number(postId),
      },
    },
    limit: 100,
    pagination: false,
  })

  return glossary.docs.map(entry => ({
    term: entry.term,
    reading: entry.reading,
    definition: entry.definition,
  }))
}

/**
 * Get all glossary terms grouped by first character (for あいうえお sorting)
 */
export async function getAllGlossaryTermsGrouped(): Promise<
  Map<string, Array<{ term: string; reading: string; definition: string; source: string; wikipediaUrl?: string }>>
> {
  const payload = await getPayload({ config: configPromise })

  const glossary = await payload.find({
    collection: 'glossary',
    limit: 10000,
    pagination: false,
    sort: 'reading', // Sort by hiragana reading
  })

  const grouped = new Map<string, Array<any>>()

  // Japanese hiragana groups
  const groups = ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ', 'その他']

  // Initialize groups
  for (const group of groups) {
    grouped.set(group, [])
  }

  for (const entry of glossary.docs) {
    const reading = entry.reading || ''
    const firstChar = reading.charAt(0)

    // Determine which group this belongs to
    let group = 'その他'

    if (firstChar >= 'あ' && firstChar <= 'お') group = 'あ'
    else if (firstChar >= 'か' && firstChar <= 'こ' || firstChar === 'が' || firstChar === 'ぎ' || firstChar === 'ぐ' || firstChar === 'げ' || firstChar === 'ご') group = 'か'
    else if (firstChar >= 'さ' && firstChar <= 'そ' || firstChar === 'ざ' || firstChar === 'じ' || firstChar === 'ず' || firstChar === 'ぜ' || firstChar === 'ぞ') group = 'さ'
    else if (firstChar >= 'た' && firstChar <= 'と' || firstChar === 'だ' || firstChar === 'ぢ' || firstChar === 'づ' || firstChar === 'で' || firstChar === 'ど') group = 'た'
    else if (firstChar >= 'な' && firstChar <= 'の') group = 'な'
    else if (firstChar >= 'は' && firstChar <= 'ほ' || firstChar === 'ば' || firstChar === 'び' || firstChar === 'ぶ' || firstChar === 'べ' || firstChar === 'ぼ' || firstChar === 'ぱ' || firstChar === 'ぴ' || firstChar === 'ぷ' || firstChar === 'ぺ' || firstChar === 'ぽ') group = 'は'
    else if (firstChar >= 'ま' && firstChar <= 'も') group = 'ま'
    else if (firstChar === 'や' || firstChar === 'ゆ' || firstChar === 'よ') group = 'や'
    else if (firstChar >= 'ら' && firstChar <= 'ろ') group = 'ら'
    else if (firstChar === 'わ' || firstChar === 'を' || firstChar === 'ん') group = 'わ'

    grouped.get(group)?.push({
      term: entry.term,
      reading: entry.reading,
      definition: entry.definition,
      source: entry.source,
      wikipediaUrl: entry.wikipediaUrl,
    })
  }

  return grouped
}
