/**
 * Script to process glossary terms from posts
 * Usage: npx tsx scripts/process-glossary.ts [--limit=10] [--post-id=123]
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { extractTerms, generateDefinition, categorizeterm } from '../src/services/openrouter'
import { fetchWikipediaDefinition } from '../src/services/wikipedia'

// Parse command line arguments
const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const postIdArg = args.find(a => a.startsWith('--post-id='))

const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10
const specificPostId = postIdArg ? postIdArg.split('=')[1] : null

/**
 * Extract plain text from Lexical content
 */
function extractTextFromLexical(content: any): string {
  if (!content || !content.root) return ''

  const extractText = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text' && node.text) {
      return node.text
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join(' ')
    }
    return ''
  }

  return extractText(content.root).replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log('Starting glossary processing...')
  console.log(`Limit: ${limit}, Specific Post ID: ${specificPostId || 'none'}`)

  const payload = await getPayload({ config })

  // Get existing terms
  const existingGlossary = await payload.find({
    collection: 'glossary',
    limit: 10000,
    pagination: false,
    select: { term: true },
  })

  const existingTerms = new Set(existingGlossary.docs.map((t: any) => t.term))
  console.log(`Existing glossary terms: ${existingTerms.size}`)

  // Get posts to process
  let posts
  if (specificPostId) {
    const post = await payload.findByID({
      collection: 'posts',
      id: specificPostId,
    })
    posts = { docs: post ? [post] : [] }
  } else {
    posts = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      limit,
      pagination: false,
    })
  }

  console.log(`Processing ${posts.docs.length} posts...`)

  let totalNewTerms = 0
  let totalLinkedTerms = 0

  for (let i = 0; i < posts.docs.length; i++) {
    const post = posts.docs[i] as any
    console.log(`\n[${i + 1}/${posts.docs.length}] Processing: ${post.title}`)

    // Extract text from content
    const textContent = extractTextFromLexical(post.content)
    if (!textContent || textContent.length < 50) {
      console.log('  Skipped: insufficient content')
      continue
    }

    // Extract terms using LLM
    console.log('  Extracting terms...')
    const extractedTerms = await extractTerms(
      textContent,
      Array.from(existingTerms),
      20
    )

    console.log(`  Found ${extractedTerms.length} terms`)

    for (const termData of extractedTerms) {
      try {
        // Check if term already exists
        if (existingTerms.has(termData.term)) {
          // Link existing term to this post
          const existing = await payload.find({
            collection: 'glossary',
            where: { term: { equals: termData.term } },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            const entry = existing.docs[0] as any
            const currentPosts = (entry.posts || []).map((p: any) =>
              typeof p === 'object' ? p.id : p
            )

            if (!currentPosts.includes(post.id)) {
              await payload.update({
                collection: 'glossary',
                id: entry.id,
                data: {
                  posts: [...currentPosts, post.id],
                },
              })
              totalLinkedTerms++
              console.log(`    Linked: ${termData.term}`)
            }
          }
          continue
        }

        // New term - try Wikipedia first
        console.log(`    Processing new term: ${termData.term}`)
        let definition = ''
        let source: 'wikipedia' | 'llm' = 'llm'
        let wikipediaUrl = ''

        const wikiResult = await fetchWikipediaDefinition(termData.term)
        if (wikiResult) {
          definition = wikiResult.definition
          source = 'wikipedia'
          wikipediaUrl = wikiResult.url
          console.log(`      Found on Wikipedia`)
        } else {
          definition = await generateDefinition(termData.term, textContent.substring(0, 500))
          console.log(`      Generated with LLM`)
        }

        if (!definition || definition.length < 10) {
          console.log(`      Skipped: no definition`)
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
            posts: [post.id],
            category,
          },
        })

        existingTerms.add(termData.term)
        totalNewTerms++
        console.log(`      Created: ${termData.term} (${termData.reading})`)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error: any) {
        console.error(`      Error: ${error.message}`)
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

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
