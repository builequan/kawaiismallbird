#!/usr/bin/env tsx
/**
 * Debug why links are breaking words in actual posts
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

function extractTextWithPositions(node: any, currentPos: number = 0): Array<{type: string; text: string; start: number; end: number; node: any}> {
  const results: Array<{type: string; text: string; start: number; end: number; node: any}> = []

  if (node.type === 'text' && node.text) {
    results.push({
      type: 'text',
      text: node.text,
      start: currentPos,
      end: currentPos + node.text.length,
      node: node
    })
    return results
  }

  if (node.type === 'link') {
    const linkText = extractText(node)
    results.push({
      type: 'link',
      text: linkText,
      start: currentPos,
      end: currentPos + linkText.length,
      node: node
    })
    return results
  }

  if (node.children && Array.isArray(node.children)) {
    let pos = currentPos
    for (const child of node.children) {
      const childResults = extractTextWithPositions(child, pos)
      results.push(...childResults)
      if (childResults.length > 0) {
        pos = childResults[childResults.length - 1].end
      }
    }
  }

  return results
}

function extractText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

async function main() {
  console.log('🔍 Debugging Actual Link Breaking')
  console.log('=' .repeat(60))

  const payload = await getPayload({ config: configPromise })

  try {
    // Get a specific post that has broken links
    const posts = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: 'from-scratch-to-pro-interpreting-scoring-averages-ja'
        }
      },
      limit: 1,
      depth: 0,
    })

    if (posts.docs.length === 0) {
      console.log('Post not found')
      return
    }

    const post = posts.docs[0]
    console.log(`\n📝 Analyzing: ${post.title}`)
    console.log(`Slug: ${post.slug}`)
    console.log('')

    if (!post.content?.root?.children) {
      console.log('No content found')
      return
    }

    // Find paragraphs with problematic links
    let paragraphIndex = 0
    for (const node of post.content.root.children) {
      if (node.type === 'paragraph') {
        const elements = extractTextWithPositions(node)
        const fullText = elements.map(e => e.text).join('')

        // Check for broken compound words
        const problematicPatterns = [
          { compound: 'スコアカード', fragment: 'スコア' },
          { compound: 'プレーヤー', fragment: 'プレー' },
          { compound: 'ゴルファー', fragment: 'ゴルフ' },
        ]

        for (const pattern of problematicPatterns) {
          if (fullText.includes(pattern.compound)) {
            // Check if there's a link breaking this word
            for (const element of elements) {
              if (element.type === 'link' && element.text === pattern.fragment) {
                const indexInFull = fullText.indexOf(pattern.compound)
                const fragmentIndex = fullText.indexOf(pattern.fragment, indexInFull)

                if (fragmentIndex >= indexInFull && fragmentIndex < indexInFull + pattern.compound.length) {
                  console.log(`❌ BROKEN WORD FOUND in paragraph ${paragraphIndex}:`)
                  console.log(`   Compound word: "${pattern.compound}"`)
                  console.log(`   Linked fragment: "${pattern.fragment}"`)
                  console.log(`   Full text: "${fullText.substring(Math.max(0, indexInFull - 10), Math.min(fullText.length, indexInFull + pattern.compound.length + 10))}"`)

                  // Show the actual node structure
                  console.log(`   Node structure:`)
                  for (let i = 0; i < elements.length; i++) {
                    const el = elements[i]
                    if (el.start <= fragmentIndex && el.end > fragmentIndex) {
                      console.log(`     [${i}] ${el.type}: "${el.text}"`)
                      if (i > 0) console.log(`     [${i-1}] ${elements[i-1].type}: "${elements[i-1].text}"`)
                      if (i < elements.length - 1) console.log(`     [${i+1}] ${elements[i+1].type}: "${elements[i+1].text}"`)
                      break
                    }
                  }
                  console.log('')
                }
              }
            }
          }
        }
        paragraphIndex++
      }
    }

    // Also check the raw lexical structure
    console.log('\n📊 Raw Lexical Structure Sample:')
    const firstParagraph = post.content.root.children.find((n: any) => n.type === 'paragraph')
    if (firstParagraph) {
      console.log(JSON.stringify(firstParagraph, null, 2).substring(0, 1000))
    }

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)