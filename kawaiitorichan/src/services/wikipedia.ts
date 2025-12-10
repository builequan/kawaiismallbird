/**
 * Japanese Wikipedia API Service
 * Fetches definitions from ja.wikipedia.org
 */

interface WikipediaSearchResult {
  query?: {
    search?: Array<{
      title: string
      pageid: number
    }>
  }
}

interface WikipediaPageResult {
  query?: {
    pages?: {
      [key: string]: {
        pageid: number
        title: string
        extract?: string
      }
    }
  }
}

/**
 * Search for a term on Japanese Wikipedia
 */
async function searchWikipedia(term: string): Promise<{ title: string; pageid: number } | null> {
  const url = new URL('https://ja.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', term)
  url.searchParams.set('srlimit', '1')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Wikipedia search failed: ${response.status}`)
    }

    const data: WikipediaSearchResult = await response.json()
    const results = data.query?.search

    if (results && results.length > 0) {
      return {
        title: results[0].title,
        pageid: results[0].pageid,
      }
    }

    return null
  } catch (error) {
    console.error('Wikipedia search error:', error)
    return null
  }
}

/**
 * Get the extract (summary) from a Wikipedia page
 */
async function getPageExtract(pageid: number): Promise<string | null> {
  const url = new URL('https://ja.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('pageids', String(pageid))
  url.searchParams.set('prop', 'extracts')
  url.searchParams.set('exintro', 'true') // Only introduction section
  url.searchParams.set('explaintext', 'true') // Plain text, no HTML
  url.searchParams.set('exsectionformat', 'plain')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Wikipedia extract failed: ${response.status}`)
    }

    const data: WikipediaPageResult = await response.json()
    const pages = data.query?.pages

    if (pages) {
      const page = pages[String(pageid)]
      if (page?.extract) {
        return page.extract
      }
    }

    return null
  } catch (error) {
    console.error('Wikipedia extract error:', error)
    return null
  }
}

/**
 * Extract first 2-3 sentences from text
 */
function extractSentences(text: string, maxSentences: number = 3): string {
  // Clean up the text
  const cleaned = text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Split by Japanese and English sentence endings
  const sentenceEndings = /([。！？\.!?])/g
  const parts = cleaned.split(sentenceEndings)

  let result = ''
  let sentenceCount = 0

  for (let i = 0; i < parts.length; i++) {
    result += parts[i]

    // Check if this part is a sentence ending
    if (parts[i].match(sentenceEndings)) {
      sentenceCount++
      if (sentenceCount >= maxSentences) {
        break
      }
    }
  }

  return result.trim()
}

export interface WikipediaDefinition {
  definition: string
  url: string
  title: string
}

/**
 * Fetch a definition from Japanese Wikipedia
 * Returns null if the term is not found
 */
export async function fetchWikipediaDefinition(
  term: string
): Promise<WikipediaDefinition | null> {
  try {
    // Search for the term
    const searchResult = await searchWikipedia(term)

    if (!searchResult) {
      return null
    }

    // Get the page extract
    const extract = await getPageExtract(searchResult.pageid)

    if (!extract || extract.length < 20) {
      return null
    }

    // Extract 2-3 sentences
    const definition = extractSentences(extract, 3)

    if (definition.length < 20) {
      return null
    }

    return {
      definition,
      url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(searchResult.title)}`,
      title: searchResult.title,
    }
  } catch (error) {
    console.error('Error fetching Wikipedia definition for', term, error)
    return null
  }
}

/**
 * Check if a term exists on Wikipedia (quick check)
 */
export async function termExistsOnWikipedia(term: string): Promise<boolean> {
  const searchResult = await searchWikipedia(term)
  return searchResult !== null
}
