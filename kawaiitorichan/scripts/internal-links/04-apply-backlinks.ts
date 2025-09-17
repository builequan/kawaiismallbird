#!/usr/bin/env tsx
/**
 * Apply internal backlinks to posts based on similarity and anchor text matching
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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

/**
 * Create a Lexical link node
 */
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

/**
 * Find potential anchor text in a text node
 */
function findAnchorMatches(
  text: string,
  candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }>
): LinkCandidate[] {
  const matches: LinkCandidate[] = []
  
  for (const candidate of candidates) {
    for (const phrase of candidate.phrases) {
      // For Japanese text, we don't need to check word boundaries
      // since Japanese doesn't use spaces between words
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(phrase)
      
      let searchStart = 0
      
      // Find all occurrences of the phrase
      while (searchStart < text.length) {
        const index = text.indexOf(phrase, searchStart)
        if (index === -1) break
        
        let shouldMatch = false
        
        if (isJapanese) {
          // For Japanese text, always match if found
          shouldMatch = true
        } else {
          // For English text, check word boundaries
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
            nodeIndex: -1, // Will be set later
            textIndex: -1, // Will be set later
            startOffset: index,
            endOffset: index + phrase.length,
          })
        }
        
        searchStart = index + phrase.length
      }
    }
  }
  
  // Sort by position (to process from end to start) and score
  matches.sort((a, b) => {
    if (a.startOffset !== b.startOffset) {
      return b.startOffset - a.startOffset // Process from end to start
    }
    return b.score - a.score // Higher score first
  })
  
  // Remove overlapping matches (keep the highest scoring ones)
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

/**
 * Process Lexical content and add internal links
 */
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
  
  // Track which phrases have already been linked to avoid duplicates
  const linkedPhrases = new Set<string>()
  
  // Deep clone the content to avoid mutations
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Process each node in the root
  if (newContent.root.children && Array.isArray(newContent.root.children)) {
    for (let nodeIndex = 0; nodeIndex < newContent.root.children.length; nodeIndex++) {
      if (totalLinksAdded >= maxLinks) break
      
      const node = newContent.root.children[nodeIndex]
      
      // Only process paragraph nodes (not headings, blocks, etc.)
      if (node.type !== 'paragraph') continue
      
      // Skip if no children
      if (!node.children || !Array.isArray(node.children)) continue
      
      // Find all text nodes and their positions
      const textNodes: Array<{ index: number; node: any }> = []
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (child.type === 'text' && child.text) {
          textNodes.push({ index: i, node: child })
        }
      }
      
      // Process each text node
      for (const { index: textIndex, node: textNode } of textNodes.reverse()) {
        if (totalLinksAdded >= maxLinks) break
        
        // Skip image markdown
        if (textNode.text.startsWith('![')) continue
        
        // Find anchor matches in this text
        const matches = findAnchorMatches(textNode.text, candidates)
        
        // Apply matches (from end to start to preserve positions)
        for (const match of matches) {
          if (totalLinksAdded >= maxLinks) break
          
          // Skip if this phrase has already been linked
          const normalizedPhrase = match.anchorText.toLowerCase()
          if (linkedPhrases.has(normalizedPhrase)) continue
          
          // Split the text node and insert link
          const beforeText = textNode.text.substring(0, match.startOffset)
          const afterText = textNode.text.substring(match.endOffset)
          
          const newNodes: any[] = []
          
          // Add text before the link (if any)
          if (beforeText) {
            newNodes.push({
              ...textNode,
              text: beforeText,
            })
          }
          
          // Add the link node (ensure ID is numeric)
          const numericId = typeof match.targetId === 'string' ? parseInt(match.targetId) : match.targetId
          newNodes.push(createLinkNode(numericId, match.anchorText))
          
          // Add text after the link (if any)
          if (afterText) {
            newNodes.push({
              ...textNode,
              text: afterText,
            })
          }
          
          // Replace the original text node with the new nodes
          node.children.splice(textIndex, 1, ...newNodes)
          
          // Track the added link
          linksAdded.push({
            targetSlug: match.targetSlug,
            anchorText: match.anchorText,
            position: `paragraph-${nodeIndex}`,
          })
          
          // Mark this phrase as linked
          linkedPhrases.add(normalizedPhrase)
          
          totalLinksAdded++
          
          // Only add one link per text node to avoid complexity
          break
        }
      }
    }
  }
  
  return { content: newContent, linksAdded }
}

async function applyBacklinks(options: { dryRun?: boolean; limit?: number } = {}) {
  const { dryRun = false, limit } = options
  
  console.log('Applying internal backlinks to posts...')
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved')
  }
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Load data files
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const similarityContent = await fs.readFile(similarityPath, 'utf-8')
    
    const indexData = JSON.parse(indexContent) as { posts: PostIndex[] }
    const similarityData = JSON.parse(similarityContent) as SimilarityData
    
    // Create maps for quick lookup (ensure string IDs)
    const postIndexMap = new Map<string, PostIndex>()
    for (const post of indexData.posts) {
      postIndexMap.set(String(post.id), post)
    }
    
    // Fetch posts to update
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
        // Get post index data
        const postIdStr = String(post.id)
        const postIndex = postIndexMap.get(postIdStr)
        if (!postIndex) {
          console.log(`⚠️  No index data for post: ${post.title}`)
          skipCount++
          continue
        }
        
        // Check if content has changed since indexing
        const currentContentHash = crypto.createHash('md5')
          .update(JSON.stringify(post.content))
          .digest('hex')
        
        // Skip if already processed with same content
        if (post.internalLinksMetadata?.contentHash === currentContentHash) {
          console.log(`⏭️  Skipping (already processed): ${post.title}`)
          skipCount++
          continue
        }
        
        // Get similar posts
        const similarities = similarityData.similarities[post.id]
        if (!similarities || similarities.similar.length === 0) {
          console.log(`⚠️  No similar posts found for: ${post.title}`)
          skipCount++
          continue
        }
        
        // Prepare link candidates
        const candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }> = []
        
        for (const similar of similarities.similar.slice(0, 10)) {
          const targetPost = postIndexMap.get(similar.id)
          if (!targetPost) continue
          
          // Use title and top anchor phrases as potential anchors
          const phrases: string[] = []
          
          // For Japanese titles, extract meaningful parts
          const title = targetPost.title
          
          // Add full title
          phrases.push(title)
          
          // If title contains Japanese colon, split and add parts
          if (title.includes('：')) {
            const parts = title.split('：')
            parts.forEach(part => {
              const cleaned = part.trim()
              if (cleaned.length >= 2) {
                phrases.push(cleaned)
              }
            })
          }
          
          // Extract meaningful phrases from title, not just single terms
          // Skip single common terms like just "ゴルフ" as they're too generic
          const golfTerms = [
            'スイング', 'クラブ', 'ボール', 'パット', 'ドライバー',
            'アイアン', 'ウッド', 'バンカー', 'グリーン', 'フェアウェイ',
            'スライス', 'フック', 'ドロー', 'フェード', 'スタンス',
            'グリップ', 'バックスイング', 'ダウンスイング', 'フォロースルー',
            '初心者', '上達', '練習', 'レッスン', 'コース', 'ラウンド',
            '飛距離', '方向性', 'ミス', '改善', '基本', 'テクニック'
          ]
          
          // Look for compound terms and phrases
          for (const term of golfTerms) {
            if (title.includes(term)) {
              // Look for compound terms containing this
              const compoundRegex = new RegExp(`[ァ-ヶー一-龯]*${term}[ァ-ヶー一-龯]*`, 'g')
              const compounds = title.match(compoundRegex)
              if (compounds) {
                compounds.forEach(compound => {
                  // Only add if it's more specific than just the term itself
                  if (compound.length > term.length + 1) {
                    phrases.push(compound)
                  }
                })
              }
            }
          }
          
          // Add standalone golf terms that should always be candidates
          const standaloneTerms = [
            'ゴルファー', 'スイング', 'テンポ', 'クラブ', 'ボール', 'グリップ',
            'スタンス', 'アドレス', 'バックスイング', 'ダウンスイング',
            'フォロースルー', 'ドライバー', 'アイアン', 'パター',
            'バンカー', 'グリーン', 'フェアウェイ', 'ティー',
            '飛距離', '方向性', 'スコア', '練習', 'レッスン'
          ]
          
          // Add standalone terms if they appear in the target post's anchor phrases
          for (const term of standaloneTerms) {
            if (targetPost.anchorPhrases.some(p => p.includes(term))) {
              phrases.push(term)
            }
          }
          
          // Add top anchor phrases from the target post, but filter out too generic ones
          const anchorPhrases = targetPost.anchorPhrases
            .filter(p => {
              // Skip only the most generic terms
              if (p === 'ゴルフ' || p === 'golf' || p === 'images') {
                return false
              }
              // Allow shorter Japanese terms (2+ characters)
              if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(p)) {
                return p.length >= 2
              }
              return p.length >= 3
            })
            .slice(0, 20)
          
          phrases.push(...anchorPhrases)
          
          // Sort phrases by length (longer = more specific = better)
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
        
        // Process content and add links
        const { content: newContent, linksAdded } = processLexicalContent(
          post.content,
          candidates,
          5 // Max 5 links per post
        )
        
        if (linksAdded.length === 0) {
          console.log(`ℹ️  No suitable anchor text found in: ${post.title}`)
          skipCount++
          continue
        }
        
        console.log(`✓ Found ${linksAdded.length} links for: ${post.title}`)
        for (const link of linksAdded) {
          console.log(`  → "${link.anchorText}" → ${link.targetSlug}`)
        }
        
        if (!dryRun) {
          // Update the post with new content and metadata
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
          console.log(`💾 Saved: ${post.title}`)
        }
        
        successCount++
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n✅ Backlinks application complete!')
    console.log(`📊 Results:`)
    console.log(`  - Successfully processed: ${successCount}`)
    console.log(`  - Skipped: ${skipCount}`)
    console.log(`  - Errors: ${errorCount}`)
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run - no changes were saved')
      console.log('Run without --dry-run flag to apply changes')
    }
    
  } catch (error) {
    console.error('Error applying backlinks:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run if called directly
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

applyBacklinks({ dryRun, limit })