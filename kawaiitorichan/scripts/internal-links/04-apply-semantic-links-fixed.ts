#!/usr/bin/env tsx
/**
 * Apply semantic internal links based on embeddings and cosine similarity
 * FIXED VERSION - No duplicates, no self-linking, no bidirectional linking
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Common Japanese verb endings for proper phrase completion
 */
const VERB_ENDINGS = [
  'する', 'した', 'して', 'すれば', 'しよう', 'します', 'しない', 'しました',
  'くる', 'きた', 'きて', 'くれば', 'こよう', 'きます', 'こない', 'きました',
  'いる', 'いた', 'いて', 'いれば', 'いよう', 'います', 'いない', 'いました',
  'ある', 'あった', 'あって', 'あれば', 'あろう', 'あります', 'ない', 'ありました',
  'できる', 'できた', 'できて', 'できれば', 'できよう', 'できます', 'できない', 'できました',
  'なる', 'なった', 'なって', 'なれば', 'なろう', 'なります', 'ならない', 'なりました',
  'れる', 'られる', 'せる', 'させる', 'れた', 'られた', 'せた', 'させた'
]

/**
 * Check if a phrase ends with a broken verb stem
 */
function isBrokenVerb(phrase: string): boolean {
  const brokenPatterns = [
    /[^で][すく]$/, // ends with す or く (but not です)
    /[いう]$/, // ends with い or う (could be incomplete)
    /[つむぶぬぐずじ]$/ // other incomplete verb stems
  ]

  return brokenPatterns.some(pattern => pattern.test(phrase))
}

/**
 * Attempt to complete a broken verb phrase
 */
function completeVerb(phrase: string, fullText: string): string {
  // Look for the complete verb in the surrounding text
  for (const ending of VERB_ENDINGS) {
    const possibleComplete = phrase + ending.substring(phrase.length > 0 ? phrase[phrase.length - 1] === ending[0] ? 1 : 0 : 0)
    if (fullText.includes(possibleComplete)) {
      return possibleComplete
    }
  }

  // If no complete version found, try common completions
  if (phrase.endsWith('す') && !phrase.endsWith('です')) {
    return phrase + 'る'
  }
  if (phrase.endsWith('く')) {
    return phrase + 'る'
  }

  return phrase // Return as-is if can't complete
}

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
  targetTitle: string
  anchorText: string
  score: number
  position: number
}

// Global tracking of established links to prevent bidirectional linking
const establishedLinks = new Map<string, Set<string>>()

function recordLink(fromId: string, toId: string) {
  if (!establishedLinks.has(fromId)) {
    establishedLinks.set(fromId, new Set())
  }
  establishedLinks.get(fromId)!.add(toId)
}

function isLinkAllowed(fromId: string, toId: string): boolean {
  // Check if reverse link already exists
  const reverseLinks = establishedLinks.get(toId)
  if (reverseLinks && reverseLinks.has(fromId)) {
    return false // Bidirectional link detected, not allowed
  }
  return true
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

function extractTextFromLexical(content: any): string {
  let text = ''
  
  if (!content || !content.root || !content.root.children) {
    return text
  }
  
  for (const node of content.root.children) {
    if (node.type === 'paragraph' && node.children) {
      for (const child of node.children) {
        if (child.type === 'text' && child.text) {
          text += child.text + ' '
        }
      }
    }
  }
  
  return text
}

/**
 * Universal metadata filter patterns (same as in index builder)
 */
const METADATA_PATTERNS = [
  // UI/Structure elements
  'ヒーロー画像', 'アイキャッチ', 'サムネイル', 'イメージ画像',
  '出典', '参考文献', 'リンク:', '画像:', 'ソース:',
  'コメント', 'シェア', 'いいね', 'フォロー',

  // Navigation/UI
  '次へ', '前へ', 'トップ', 'ホーム', 'メニュー', 'ページ',
  'クリック', 'タップ', 'スクロール', 'ズーム',

  // Time/Date patterns
  /^\d{4}年\d{1,2}月/, /^\d{1,2}月\d{1,2}日/, /^今週/, /^先週/, /^来週/,

  // Common unrelated terms (any domain)
  /^(州|市|町|村)(議会|長|役所|政府)/, // Political terms
  /^(動画|ビデオ|写真|図|表|グラフ|チャート)/, // Media/visualization labels
  /^\[.*\]/, // Bracketed content (often metadata)

  // Reference/citation patterns
  /リンク$/, /ページ$/, /サイト$/,
]

/**
 * Check if a phrase is metadata/structural content
 */
function isMetadataPhrase(phrase: string): boolean {
  return METADATA_PATTERNS.some(pattern =>
    typeof pattern === 'string'
      ? phrase.includes(pattern)
      : pattern.test(phrase)
  )
}

/**
 * Calculate relevance score for an anchor phrase
 */
function calculateRelevanceScore(
  phrase: string,
  sourceText: string,
  targetPost: PostIndex
): number {
  let score = 0

  // Base score from phrase length (longer = more specific)
  score += phrase.length * 0.5

  // Bonus if phrase appears in target title
  if (targetPost.title.includes(phrase)) {
    score += 10
  }

  // Bonus if phrase appears multiple times in source
  const occurrences = (sourceText.match(new RegExp(phrase, 'g')) || []).length
  score += Math.min(occurrences * 2, 6) // Cap bonus at 3 occurrences

  // Penalty for very generic single words
  if (phrase.length <= 2) {
    score -= 5
  }

  // Penalty for metadata phrases
  if (isMetadataPhrase(phrase)) {
    score -= 20
  }

  return score
}

function findBestAnchorPhrases(
  text: string,
  targetPost: PostIndex
): string[] {
  const candidates: Array<{phrase: string, score: number}> = []

  // Find phrases from target's anchor phrases that exist in source text
  const meaningfulPhrases = targetPost.anchorPhrases
    .filter(phrase => {
      if (phrase.length < 3) return false
      if (isMetadataPhrase(phrase)) return false
      return text.includes(phrase)
    })
    .map(phrase => ({
      phrase,
      score: calculateRelevanceScore(phrase, text, targetPost)
    }))
    .sort((a, b) => b.score - a.score)

  candidates.push(...meaningfulPhrases)

  // Return top candidates, removing duplicates
  const uniquePhrases = [...new Set(candidates.map(c => c.phrase))]
  return uniquePhrases.slice(0, 5)
}

function selectDiverseLinks(
  postId: string,
  similarPosts: Array<{ id: string; slug: string; score: number }>,
  postIndex: Map<string, PostIndex>,
  contentText: string,
  maxLinks: number = 5
): LinkCandidate[] {
  const selectedLinks: LinkCandidate[] = []
  const usedTargets = new Set<string>()
  const usedAnchorTexts = new Set<string>()
  
  // Only consider posts with high similarity scores
  const highQualityMatches = similarPosts
    .filter(p => p.score >= 0.7) // Higher threshold for better quality
    .filter(p => p.id !== postId) // No self-links
    .filter(p => isLinkAllowed(postId, p.id)) // No bidirectional links
  
  for (const similar of highQualityMatches) {
    if (selectedLinks.length >= maxLinks) break
    if (usedTargets.has(similar.id)) continue
    
    const targetPost = postIndex.get(similar.id)
    if (!targetPost) continue
    
    // Find natural anchor phrases from the content
    const anchorCandidates = findBestAnchorPhrases(contentText, targetPost)
    
    for (const anchor of anchorCandidates) {
      if (usedAnchorTexts.has(anchor.toLowerCase())) continue
      
      const position = contentText.indexOf(anchor)
      if (position === -1) continue
      
      selectedLinks.push({
        targetId: similar.id,
        targetSlug: similar.slug,
        targetTitle: targetPost.title,
        anchorText: anchor,
        score: similar.score,
        position: position
      })
      
      usedTargets.add(similar.id)
      usedAnchorTexts.add(anchor.toLowerCase())
      
      // Record this link to prevent bidirectional linking
      recordLink(postId, similar.id)
      
      break // One link per target
    }
  }
  
  // Sort by position in text (link earlier mentions first)
  selectedLinks.sort((a, b) => a.position - b.position)
  
  return selectedLinks
}

function applyLinksToContent(
  content: any,
  links: LinkCandidate[]
): { content: any; linksAdded: Array<{ targetSlug: string; anchorText: string; position: string }> } {
  if (!content || !content.root || links.length === 0) {
    return { content, linksAdded: [] }
  }
  
  const linksAdded: Array<{ targetSlug: string; anchorText: string; position: string }> = []
  const newContent = JSON.parse(JSON.stringify(content))
  const appliedAnchors = new Set<string>()
  
  if (newContent.root.children && Array.isArray(newContent.root.children)) {
    // Process each paragraph
    for (let nodeIndex = 0; nodeIndex < newContent.root.children.length; nodeIndex++) {
      const node = newContent.root.children[nodeIndex]
      
      if (node.type !== 'paragraph' || !node.children) continue
      
      // Collect all text positions and links that apply to this paragraph
      const paragraphLinks: Array<{link: LinkCandidate, childIndex: number, position: number}> = []
      
      for (let childIndex = 0; childIndex < node.children.length; childIndex++) {
        const child = node.children[childIndex]
        
        if (child.type !== 'text' || !child.text) continue
        
        for (const link of links) {
          if (appliedAnchors.has(link.anchorText)) continue
          
          const position = child.text.indexOf(link.anchorText)
          if (position !== -1) {
            paragraphLinks.push({
              link,
              childIndex,
              position
            })
            appliedAnchors.add(link.anchorText)
            break // Only one link per anchor text
          }
        }
      }
      
      // Sort by childIndex DESC, then position DESC to process from end to beginning
      paragraphLinks.sort((a, b) => {
        if (a.childIndex !== b.childIndex) {
          return b.childIndex - a.childIndex
        }
        return b.position - a.position
      })
      
      // Apply links from end to beginning
      for (const { link, childIndex, position } of paragraphLinks) {
        const child = node.children[childIndex]
        
        if (!child || child.type !== 'text') continue
        
        const beforeText = child.text.substring(0, position)
        const afterText = child.text.substring(position + link.anchorText.length)
        
        const newNodes: any[] = []
        
        if (beforeText) {
          newNodes.push({ ...child, text: beforeText })
        }
        
        const numericId = typeof link.targetId === 'string' ? parseInt(link.targetId) : link.targetId
        newNodes.push(createLinkNode(numericId, link.anchorText))
        
        if (afterText) {
          newNodes.push({ ...child, text: afterText })
        }
        
        // Replace the text node with new nodes
        node.children.splice(childIndex, 1, ...newNodes)
        
        linksAdded.push({
          targetSlug: link.targetSlug,
          anchorText: link.anchorText,
          position: `paragraph-${nodeIndex}`
        })
      }
    }
  }
  
  return { content: newContent, linksAdded }
}

async function applySemanticLinks(options: { limit?: number; force?: boolean } = {}) {
  const { limit, force = false } = options
  
  console.log('🧠 Applying semantic internal links (FIXED - no duplicates)...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Load index and similarity data
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const similarityContent = await fs.readFile(similarityPath, 'utf-8')
    
    const indexData = JSON.parse(indexContent) as { posts: PostIndex[] }
    const similarityData = JSON.parse(similarityContent) as SimilarityData
    
    // Create index map
    const postIndexMap = new Map<string, PostIndex>()
    for (const post of indexData.posts) {
      postIndexMap.set(String(post.id), post)
    }
    
    // Fetch posts to process
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
    console.log('Building link graph to prevent bidirectional links...')
    
    // Clear established links tracking
    establishedLinks.clear()
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // Sort posts by ID to ensure consistent processing order
    posts.sort((a, b) => a.id - b.id)
    
    for (const post of posts) {
      try {
        const postIdStr = String(post.id)
        
        // Get similarity data for this post
        const similarities = similarityData.similarities[postIdStr]
        if (!similarities || !similarities.similar || similarities.similar.length === 0) {
          console.log(`⚠️  No similar posts for: ${post.title}`)
          skipCount++
          continue
        }
        
        // Skip if already processed (unless force)
        const postIndex = postIndexMap.get(postIdStr)
        if (!force && postIndex && post.internal_links_metadata_content_hash === postIndex.contentHash) {
          console.log(`⏭️  Already processed: ${post.title}`)
          skipCount++
          continue
        }
        
        console.log(`\n🔄 Processing: ${post.title} (ID: ${post.id})`)
        
        // Extract text content
        const contentText = extractTextFromLexical(post.content)
        if (!contentText) {
          console.log(`  ⚠️  No text content found`)
          skipCount++
          continue
        }
        
        // Select diverse, high-quality links (with bidirectional check)
        const selectedLinks = selectDiverseLinks(
          postIdStr,
          similarities.similar,
          postIndexMap,
          contentText,
          5 // max links per post
        )
        
        if (selectedLinks.length === 0) {
          console.log(`  ℹ️  No suitable links found (may be blocked by bidirectional check)`)
          skipCount++
          continue
        }
        
        console.log(`  📊 Found ${selectedLinks.length} semantic links:`)
        for (const link of selectedLinks) {
          console.log(`    → "${link.anchorText}" → ${link.targetSlug} (score: ${link.score.toFixed(3)})`)
        }
        
        // Apply links to content
        const { content: newContent, linksAdded } = applyLinksToContent(post.content, selectedLinks)
        
        // Calculate content hash
        const contentHash = crypto.createHash('md5')
          .update(JSON.stringify(newContent))
          .digest('hex')
        
        // Update post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: newContent,
            internal_links_metadata_version: '3.0.0',
            internal_links_metadata_last_processed: new Date(),
            internal_links_metadata_links_added: linksAdded,
            internal_links_metadata_content_hash: contentHash,
          },
        })
        
        console.log(`  ✅ Saved with ${linksAdded.length} links (no duplicates)`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Semantic linking complete (FIXED VERSION)!')
    console.log(`📊 Results:`)
    console.log(`  - Successfully processed: ${successCount}`)
    console.log(`  - Skipped: ${skipCount}`)
    console.log(`  - Errors: ${errorCount}`)
    console.log('\n📈 Link graph statistics:')
    console.log(`  - Total posts with outgoing links: ${establishedLinks.size}`)
    let totalLinks = 0
    establishedLinks.forEach(targets => totalLinks += targets.size)
    console.log(`  - Total links created: ${totalLinks}`)
    console.log(`  - Average links per post: ${establishedLinks.size > 0 ? (totalLinks / establishedLinks.size).toFixed(2) : 0}`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('Error applying semantic links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Parse command line arguments
const args = process.argv.slice(2)
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const force = args.includes('--force')

applySemanticLinks({ limit, force })