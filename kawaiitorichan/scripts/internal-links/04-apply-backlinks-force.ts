#!/usr/bin/env tsx
/**
 * FORCE apply internal backlinks (ignores contentHash)
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Import the same interfaces and functions from original
interface PostIndex {
  id: string
  slug: string
  title: string
  anchorPhrases: string[]
  contentHash: string
}

interface SimilarityData {
  threshold: number
  similarities: {
    [postId: string]: {
      slug: string
      similar: Array<{
        id: string
        slug: string
        score: number
      }>
    }
  }
}

interface LinkCandidate {
  targetId: string
  targetSlug: string
  anchorText: string
  score: number
  nodeIndex: number
  textIndex: number
  startOffset: number
  endOffset: number
}

function createLinkNode(targetId: string | number, anchorText: string): any {
  return {
    type: 'link',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: anchorText,
        version: 1,
      }
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 2,
    fields: {
      linkType: 'internal',
      doc: {
        value: targetId,
        relationTo: 'posts'
      },
      newTab: false,
      url: null
    }
  }
}

function findAnchorMatches(
  text: string,
  candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }>
): LinkCandidate[] {
  const matches: LinkCandidate[] = []
  
  for (const candidate of candidates) {
    for (const phrase of candidate.phrases) {
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(phrase)
      
      let searchStart = 0
      
      while (searchStart < text.length) {
        const index = text.indexOf(phrase, searchStart)
        if (index === -1) break
        
        let shouldMatch = false
        
        if (isJapanese) {
          shouldMatch = true
        } else {
          const beforeOk = index === 0 || /\W/.test(text[index - 1])
          const afterOk = index + phrase.length >= text.length || /\W/.test(text[index + phrase.length])
          shouldMatch = beforeOk && afterOk
        }
        
        if (shouldMatch) {
          matches.push({
            targetId: candidate.id,
            targetSlug: candidate.slug,
            anchorText: text.substring(index, index + phrase.length),
            score: candidate.score,
            nodeIndex: -1,
            textIndex: -1,
            startOffset: index,
            endOffset: index + phrase.length,
          })
        }
        
        searchStart = index + phrase.length
      }
    }
  }
  
  matches.sort((a, b) => {
    if (a.startOffset !== b.startOffset) {
      return b.startOffset - a.startOffset
    }
    return b.score - a.score
  })
  
  const filtered: LinkCandidate[] = []
  for (const match of matches) {
    const overlaps = filtered.some(existing => 
      (match.startOffset >= existing.startOffset && match.startOffset < existing.endOffset) ||
      (match.endOffset > existing.startOffset && match.endOffset <= existing.endOffset)
    )
    if (!overlaps) {
      filtered.push(match)
    }
  }
  
  return filtered
}

function processLexicalContent(
  content: any,
  candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }>,
  maxLinks: number = 5
): { content: any; linksAdded: Array<{ targetSlug: string; anchorText: string; position: string }> } {
  if (!content || !content.root) {
    return { content, linksAdded: [] }
  }
  
  const linksAdded: Array<{ targetSlug: string; anchorText: string; position: string }> = []
  let totalLinksAdded = 0
  const linkedPhrases = new Set<string>()
  const newContent = JSON.parse(JSON.stringify(content))
  
  if (newContent.root.children && Array.isArray(newContent.root.children)) {
    for (let nodeIndex = 0; nodeIndex < newContent.root.children.length; nodeIndex++) {
      if (totalLinksAdded >= maxLinks) break
      
      const node = newContent.root.children[nodeIndex]
      
      if (node.type !== 'paragraph') continue
      if (!node.children || !Array.isArray(node.children)) continue
      
      const textNodes: Array<{ index: number; node: any }> = []
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (child.type === 'text' && child.text) {
          textNodes.push({ index: i, node: child })
        }
      }
      
      for (const { index: textIndex, node: textNode } of textNodes.reverse()) {
        if (totalLinksAdded >= maxLinks) break
        
        if (textNode.text.startsWith('![')) continue
        
        const matches = findAnchorMatches(textNode.text, candidates)
        
        for (const match of matches) {
          if (totalLinksAdded >= maxLinks) break
          
          const normalizedPhrase = match.anchorText.toLowerCase()
          if (linkedPhrases.has(normalizedPhrase)) continue
          
          const beforeText = textNode.text.substring(0, match.startOffset)
          const afterText = textNode.text.substring(match.endOffset)
          
          const newNodes: any[] = []
          
          if (beforeText) {
            newNodes.push({
              ...textNode,
              text: beforeText,
            })
          }
          
          const numericId = typeof match.targetId === 'string' ? parseInt(match.targetId) : match.targetId
          newNodes.push(createLinkNode(numericId, match.anchorText))
          
          if (afterText) {
            newNodes.push({
              ...textNode,
              text: afterText,
            })
          }
          
          node.children.splice(textIndex, 1, ...newNodes)
          
          linksAdded.push({
            targetSlug: match.targetSlug,
            anchorText: match.anchorText,
            position: `paragraph-${nodeIndex}`,
          })
          
          linkedPhrases.add(normalizedPhrase)
          totalLinksAdded++
          break
        }
      }
    }
  }
  
  return { content: newContent, linksAdded }
}

async function applyBacklinks(options: { limit?: number } = {}) {
  const { limit } = options
  
  console.log('🔥 FORCE applying internal backlinks (ignoring contentHash)...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const similarityContent = await fs.readFile(similarityPath, 'utf-8')
    
    const indexData = JSON.parse(indexContent) as { posts: PostIndex[] }
    const similarityData = JSON.parse(similarityContent) as SimilarityData
    
    const postIndexMap = new Map<string, PostIndex>()
    for (const post of indexData.posts) {
      postIndexMap.set(String(post.id), post)
    }
    
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: limit || 1000,
      where: {
        _status: {
          equals: 'published'
        }
      },
      depth: 0,
    })
    
    console.log(`Processing ${posts.length} posts...`)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (const post of posts) {
      try {
        const postIdStr = String(post.id)
        const postIndex = postIndexMap.get(postIdStr)
        if (!postIndex) {
          console.log(`⚠️  No index data for: ${post.title}`)
          skipCount++
          continue
        }
        
        // FORCE: Skip contentHash check
        console.log(`🔄 Processing: ${post.title}`)
        
        const similarities = similarityData.similarities[post.id]
        if (!similarities || similarities.similar.length === 0) {
          console.log(`  ⚠️  No similar posts found`)
          skipCount++
          continue
        }
        
        const candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }> = []
        
        for (const similar of similarities.similar.slice(0, 10)) {
          const targetPost = postIndexMap.get(similar.id)
          if (!targetPost) continue
          
          const phrases: string[] = []
          const title = targetPost.title
          phrases.push(title)
          
          if (title.includes('：')) {
            const parts = title.split('：')
            parts.forEach(part => {
              const cleaned = part.trim()
              if (cleaned.length >= 2) {
                phrases.push(cleaned)
              }
            })
          }
          
          const golfTerms = [
            'スイング', 'クラブ', 'ボール', 'パット', 'ドライバー',
            'アイアン', 'グリップ', 'スタンス', 'バックスイング'
          ]
          
          for (const term of golfTerms) {
            if (targetPost.anchorPhrases.some(p => p.includes(term))) {
              phrases.push(term)
            }
          }
          
          const anchorPhrases = targetPost.anchorPhrases
            .filter(p => p.length >= 2 && p !== 'ゴルフ')
            .slice(0, 20)
          
          phrases.push(...anchorPhrases)
          
          const sortedPhrases = [...new Set(phrases)]
            .filter(p => p && p.length >= 2)
            .sort((a, b) => b.length - a.length)
          
          candidates.push({
            id: similar.id,
            slug: similar.slug,
            phrases: sortedPhrases,
            score: similar.score,
          })
        }
        
        const { content: newContent, linksAdded } = processLexicalContent(
          post.content,
          candidates,
          5
        )
        
        if (linksAdded.length === 0) {
          console.log(`  ℹ️  No suitable anchor text found`)
          skipCount++
          continue
        }
        
        console.log(`  ✓ Found ${linksAdded.length} links`)
        for (const link of linksAdded.slice(0, 3)) {
          console.log(`    → "${link.anchorText}" → ${link.targetSlug}`)
        }
        
        const currentContentHash = crypto.createHash('md5')
          .update(JSON.stringify(newContent))
          .digest('hex')
        
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: newContent,
            internalLinksMetadata: {
              version: '1.0.0',
              lastProcessed: new Date().toISOString(),
              linksAdded,
              contentHash: currentContentHash,
            },
          },
        })
        console.log(`  💾 Saved!`)
        
        successCount++
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n✅ FORCE application complete!')
    console.log(`📊 Results:`)
    console.log(`  - Successfully processed: ${successCount}`)
    console.log(`  - Skipped: ${skipCount}`)
    console.log(`  - Errors: ${errorCount}`)
    
  } catch (error) {
    console.error('Error applying backlinks:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

const args = process.argv.slice(2)
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

applyBacklinks({ limit })