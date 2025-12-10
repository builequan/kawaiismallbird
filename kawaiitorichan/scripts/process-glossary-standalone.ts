/**
 * Standalone script to process glossary terms from posts
 * Self-contained - no external service imports
 * Usage: OPENROUTER_API_KEY=xxx npx tsx scripts/process-glossary-standalone.ts --limit=10
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

// Parse command line arguments
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4.5'

// ============= OpenRouter Service =============
async function callOpenRouter(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kawaiitorichan.com',
      'X-Title': 'Kawaii Torichan Glossary',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

interface ExtractedTerm {
  term: string
  reading: string
  category?: string
}

async function extractTerms(content: string, existingTerms: string[], maxTerms: number = 20): Promise<ExtractedTerm[]> {
  const systemPrompt = `You are a Japanese language expert specializing in bird-related vocabulary.
Extract important Japanese terms from blog posts about birds.

Focus on:
- Bird species names (鳥の種類): e.g., 文鳥、インコ、オウム
- Bird care terms (鳥の飼育): e.g., 餌、ケージ、止まり木
- Bird anatomy (鳥の体): e.g., 羽、くちばし、爪
- Bird behavior (鳥の行動): e.g., さえずり、換羽、発情
- Equipment (用品): e.g., 鳥かご、ヒーター、おもちゃ
- Food terms (餌・食べ物): e.g., シード、ペレット、野菜
- Health terms (健康): e.g., 病気、獣医、薬

Do NOT include common particles, verbs, or generic adjectives.

Return ONLY a JSON array (no markdown):
[{"term": "日本語の用語", "reading": "ひらがなのよみかた", "category": "category-slug"}]

Categories: bird-species, bird-care, bird-anatomy, bird-behavior, equipment, food, health, general`

  const existingList = existingTerms.length > 0 ? `\n\nDo NOT include these terms (already in glossary):\n${existingTerms.slice(0, 100).join('、')}` : ''

  const prompt = `Extract up to ${maxTerms} important Japanese terms from this bird blog post:
${existingList}

Content:
${content.substring(0, 6000)}`

  try {
    const response = await callOpenRouter(prompt, systemPrompt)
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')

    const terms: ExtractedTerm[] = JSON.parse(jsonStr)
    return terms.filter(t => t.term && t.reading).slice(0, maxTerms)
  } catch (error) {
    console.error('Error extracting terms:', error)
    return []
  }
}

async function generateDefinition(term: string, context?: string): Promise<string> {
  const systemPrompt = `You are a Japanese encyclopedia writer specializing in birds and pet care.
Generate clear, informative definitions in Japanese.
Definitions should be 2-3 sentences, factual, and helpful for bird owners.
Do NOT include the term itself at the start of the definition.`

  const contextInfo = context ? `\n\nContext:\n${context.substring(0, 800)}` : ''
  const prompt = `Write a 2-3 sentence definition in Japanese for this bird-related term:

Term: ${term}
${contextInfo}

Write ONLY the definition, nothing else.`

  try {
    return (await callOpenRouter(prompt, systemPrompt)).trim()
  } catch (error) {
    console.error('Error generating definition:', error)
    return ''
  }
}

// ============= Wikipedia Service =============
async function fetchWikipediaDefinition(term: string): Promise<{ definition: string; url: string } | null> {
  try {
    // Search
    const searchUrl = new URL('https://ja.wikipedia.org/w/api.php')
    searchUrl.searchParams.set('action', 'query')
    searchUrl.searchParams.set('list', 'search')
    searchUrl.searchParams.set('srsearch', term)
    searchUrl.searchParams.set('srlimit', '1')
    searchUrl.searchParams.set('format', 'json')
    searchUrl.searchParams.set('origin', '*')

    const searchResp = await fetch(searchUrl.toString())
    if (!searchResp.ok) return null
    const searchData = await searchResp.json()
    const results = searchData.query?.search
    if (!results || results.length === 0) return null

    const { title, pageid } = results[0]

    // Get extract
    const extractUrl = new URL('https://ja.wikipedia.org/w/api.php')
    extractUrl.searchParams.set('action', 'query')
    extractUrl.searchParams.set('pageids', String(pageid))
    extractUrl.searchParams.set('prop', 'extracts')
    extractUrl.searchParams.set('exintro', 'true')
    extractUrl.searchParams.set('explaintext', 'true')
    extractUrl.searchParams.set('format', 'json')
    extractUrl.searchParams.set('origin', '*')

    const extractResp = await fetch(extractUrl.toString())
    if (!extractResp.ok) return null
    const extractData = await extractResp.json()
    const page = extractData.query?.pages?.[String(pageid)]
    if (!page?.extract || page.extract.length < 20) return null

    // Extract 2-3 sentences
    const text = page.extract.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
    const parts = text.split(/([。！？\.!?])/)
    let definition = ''
    let count = 0
    for (let i = 0; i < parts.length && count < 3; i++) {
      definition += parts[i]
      if (parts[i].match(/[。！？\.!?]/)) count++
    }

    if (definition.length < 20) return null

    return {
      definition: definition.trim(),
      url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    }
  } catch {
    return null
  }
}

// ============= Main Processing =============
function extractTextFromLexical(content: any): string {
  if (!content || !content.root) return ''
  const extractText = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text' && node.text) return node.text
    if (node.children && Array.isArray(node.children)) return node.children.map(extractText).join(' ')
    return ''
  }
  return extractText(content.root).replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log('=== Glossary Processing Started ===')
  console.log(`Processing ${limit} posts`)
  console.log(`OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? 'Set' : 'NOT SET'}`)

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY environment variable is required')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // Check if glossary collection exists
  try {
    const testGlossary = await payload.find({ collection: 'glossary', limit: 1 })
    console.log(`Existing glossary entries: ${testGlossary.totalDocs}`)
  } catch (e: any) {
    console.error('ERROR: Glossary collection not found. Please run migrations first.')
    console.error(e.message)
    process.exit(1)
  }

  // Get existing terms
  const existingGlossary = await payload.find({
    collection: 'glossary',
    limit: 10000,
    pagination: false,
    select: { term: true },
  })
  const existingTerms = new Set(existingGlossary.docs.map((t: any) => t.term))
  console.log(`Existing terms in glossary: ${existingTerms.size}`)

  // Get posts
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit,
    pagination: false,
  })
  console.log(`Posts to process: ${posts.docs.length}`)

  let totalNewTerms = 0
  let totalLinkedTerms = 0

  for (let i = 0; i < posts.docs.length; i++) {
    const post = posts.docs[i] as any
    console.log(`\n[${i + 1}/${posts.docs.length}] ${post.title}`)

    const textContent = extractTextFromLexical(post.content)
    if (!textContent || textContent.length < 50) {
      console.log('  Skip: insufficient content')
      continue
    }

    console.log('  Extracting terms...')
    const extractedTerms = await extractTerms(textContent, Array.from(existingTerms), 20)
    console.log(`  Found ${extractedTerms.length} potential terms`)

    for (const termData of extractedTerms) {
      try {
        if (existingTerms.has(termData.term)) {
          // Link to existing
          const existing = await payload.find({
            collection: 'glossary',
            where: { term: { equals: termData.term } },
            limit: 1,
          })
          if (existing.docs.length > 0) {
            const entry = existing.docs[0] as any
            const currentPosts = (entry.posts || []).map((p: any) => typeof p === 'object' ? p.id : p)
            if (!currentPosts.includes(post.id)) {
              await payload.update({
                collection: 'glossary',
                id: entry.id,
                data: { posts: [...currentPosts, post.id] },
              })
              totalLinkedTerms++
              console.log(`    Linked: ${termData.term}`)
            }
          }
          continue
        }

        console.log(`    New term: ${termData.term}`)

        // Try Wikipedia
        let definition = ''
        let source: 'wikipedia' | 'llm' = 'llm'
        let wikipediaUrl = ''

        const wiki = await fetchWikipediaDefinition(termData.term)
        if (wiki) {
          definition = wiki.definition
          source = 'wikipedia'
          wikipediaUrl = wiki.url
          console.log(`      Wikipedia: found`)
        } else {
          definition = await generateDefinition(termData.term, textContent.substring(0, 500))
          console.log(`      LLM: generated`)
        }

        if (!definition || definition.length < 10) {
          console.log(`      Skip: no definition`)
          continue
        }

        await payload.create({
          collection: 'glossary',
          data: {
            term: termData.term,
            reading: termData.reading,
            definition,
            source,
            wikipediaUrl: wikipediaUrl || undefined,
            posts: [post.id],
            category: termData.category || 'general',
          },
        })

        existingTerms.add(termData.term)
        totalNewTerms++
        console.log(`      Created: ${termData.term} (${termData.reading})`)

        await new Promise(r => setTimeout(r, 300))
      } catch (err: any) {
        console.error(`      Error: ${err.message}`)
      }
    }
  }

  console.log(`\n========== SUMMARY ==========`)
  console.log(`Posts processed: ${posts.docs.length}`)
  console.log(`New terms created: ${totalNewTerms}`)
  console.log(`Existing terms linked: ${totalLinkedTerms}`)
  console.log(`Total glossary terms: ${existingTerms.size}`)
  console.log(`\nGlossary page: https://kawaiitorichan.com/glossary`)

  process.exit(0)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
