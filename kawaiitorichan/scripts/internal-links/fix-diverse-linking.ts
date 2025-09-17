#!/usr/bin/env tsx
/**
 * Fix internal links to ensure each word links to a different article
 * This ensures diversity in link targets
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

function findBestAnchorPhraseForPost(
  text: string, 
  targetPost: PostIndex,
  usedAnchorTexts: Set<string>
): string | null {
  // Priority 1: Try to find meaningful golf terms
  const golfTerms = [
    'スイング', 'グリップ', 'スタンス', 'ドライバー', 'アイアン',
    'パット', 'バックスイング', 'フォロースルー', 'アプローチ',
    'ティーショット', 'フェアウェイ', 'グリーン', 'バンカー',
    'ショートゲーム', 'ロングゲーム', 'パター', 'ウェッジ',
    'ハンディキャップ', 'スコア', 'ボール', 'クラブ',
    'ゴルフレッスン', 'ゴルフルール', 'エチケット', 'メンタルゲーム',
    'スイングプレーン', '練習方法', 'ゴルフグローブ', 'プロフェッショナル分析'
  ]
  
  // Find the best matching term for this specific target post
  const candidates: Array<{phrase: string, score: number}> = []
  
  // First, look for terms that are specific to this post's title or anchor phrases
  for (const term of golfTerms) {
    if (text.includes(term) && !usedAnchorTexts.has(term)) {
      // Calculate relevance score
      let score = 0
      
      // High score if term is in the target post's title
      if (targetPost.title.includes(term)) {
        score += 10
      }
      
      // Medium score if term is in the target's anchor phrases
      if (targetPost.anchorPhrases.some(p => p.includes(term))) {
        score += 5
      }
      
      // Add score based on term specificity (longer terms are more specific)
      score += term.length / 2
      
      if (score > 0) {
        candidates.push({ phrase: term, score })
      }
    }
  }
  
  // Also check for phrases from the target's anchor phrases that exist in the text
  for (const phrase of targetPost.anchorPhrases) {
    if (phrase.length >= 3 && text.includes(phrase) && !usedAnchorTexts.has(phrase)) {
      let score = 8 // Base score for matching anchor phrase
      score += phrase.length / 3 // Longer phrases get higher score
      candidates.push({ phrase, score })
    }
  }
  
  // Sort by score and return the best match
  candidates.sort((a, b) => b.score - a.score)
  
  return candidates.length > 0 ? candidates[0].phrase : null
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
  
  // Get more potential targets than we need, to have options
  const potentialTargets = similarPosts
    .filter(p => p.score >= 0.6) // Lower threshold to get more options
    .filter(p => p.id !== postId) // No self-links
    .filter(p => isLinkAllowed(postId, p.id)) // No bidirectional links
    .slice(0, maxLinks * 3) // Get 3x more potential targets
  
  // Try to link to different posts with different anchor texts
  for (const similar of potentialTargets) {
    if (selectedLinks.length >= maxLinks) break
    if (usedTargets.has(similar.id)) continue
    
    const targetPost = postIndex.get(similar.id)
    if (!targetPost) continue
    
    // Find the best anchor phrase for this specific target
    const anchor = findBestAnchorPhraseForPost(contentText, targetPost, usedAnchorTexts)
    
    if (anchor) {
      const position = contentText.indexOf(anchor)
      if (position !== -1) {
        selectedLinks.push({
          targetId: similar.id,
          targetSlug: similar.slug,
          targetTitle: targetPost.title,
          anchorText: anchor,
          score: similar.score,
          position: position
        })
        
        usedTargets.add(similar.id)
        usedAnchorTexts.add(anchor)
        
        // Record this link to prevent bidirectional linking
        recordLink(postId, similar.id)
      }
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

async function fixDiverseLinks() {
  console.log('🔧 Fixing internal links to ensure diverse targets...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // First, remove all existing internal links
    console.log('🗑️  Removing existing links...')
    
    const { docs: allPosts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: {
          equals: 'published'
        }
      },
      depth: 0,
    })
    
    for (const post of allPosts) {
      if (post.content && post.content.root) {
        const cleanContent = JSON.parse(JSON.stringify(post.content))
        
        // Function to remove links from content
        function removeLinks(node: any) {
          if (!node || typeof node !== 'object') return node
          
          if (node.type === 'link' && node.fields?.linkType === 'internal') {
            // Replace link with its text content
            const textContent = node.children?.[0]?.text || ''
            return {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: textContent,
              version: 1
            }
          }
          
          if (node.children && Array.isArray(node.children)) {
            const newChildren: any[] = []
            for (const child of node.children) {
              const processed = removeLinks(child)
              if (processed) {
                if (Array.isArray(processed)) {
                  newChildren.push(...processed)
                } else {
                  newChildren.push(processed)
                }
              }
            }
            
            // Merge adjacent text nodes
            const mergedChildren: any[] = []
            for (const child of newChildren) {
              if (child.type === 'text' && mergedChildren.length > 0 && 
                  mergedChildren[mergedChildren.length - 1].type === 'text') {
                mergedChildren[mergedChildren.length - 1].text += child.text
              } else {
                mergedChildren.push(child)
              }
            }
            
            node.children = mergedChildren
          }
          
          return node
        }
        
        if (cleanContent.root.children) {
          for (let i = 0; i < cleanContent.root.children.length; i++) {
            cleanContent.root.children[i] = removeLinks(cleanContent.root.children[i])
          }
        }
        
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: cleanContent,
            internal_links_metadata_version: null,
            internal_links_metadata_last_processed: null,
            internal_links_metadata_links_added: null,
            internal_links_metadata_content_hash: null,
          },
        })
      }
    }
    
    console.log('✅ Removed all existing links')
    
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
    
    // Clear established links tracking
    establishedLinks.clear()
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // Sort posts by ID to ensure consistent processing order
    allPosts.sort((a, b) => a.id - b.id)
    
    console.log('📝 Applying diverse links...')
    
    for (const post of allPosts) {
      try {
        const postIdStr = String(post.id)
        
        // Get similarity data for this post
        const similarities = similarityData.similarities[postIdStr]
        if (!similarities || !similarities.similar || similarities.similar.length === 0) {
          console.log(`⚠️  No similar posts for: ${post.title}`)
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
        
        // Select diverse links - each anchor text to different target
        const selectedLinks = selectDiverseLinks(
          postIdStr,
          similarities.similar,
          postIndexMap,
          contentText,
          5 // max links per post
        )
        
        if (selectedLinks.length === 0) {
          console.log(`  ℹ️  No suitable links found`)
          skipCount++
          continue
        }
        
        console.log(`  📊 Found ${selectedLinks.length} diverse links:`)
        for (const link of selectedLinks) {
          console.log(`    → "${link.anchorText}" → ${link.targetSlug} (Post ${link.targetId})`)
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
            internal_links_metadata_version: '4.0.0',
            internal_links_metadata_last_processed: new Date(),
            internal_links_metadata_links_added: linksAdded,
            internal_links_metadata_content_hash: contentHash,
          },
        })
        
        console.log(`  ✅ Saved with ${linksAdded.length} diverse links`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Diverse linking complete!')
    console.log(`📊 Results:`)
    console.log(`  - Successfully processed: ${successCount}`)
    console.log(`  - Skipped: ${skipCount}`)
    console.log(`  - Errors: ${errorCount}`)
    console.log('\n📈 Link statistics:')
    console.log(`  - Total posts with links: ${establishedLinks.size}`)
    let totalLinks = 0
    establishedLinks.forEach(targets => totalLinks += targets.size)
    console.log(`  - Total unique links: ${totalLinks}`)
    console.log(`  - Average links per post: ${establishedLinks.size > 0 ? (totalLinks / establishedLinks.size).toFixed(2) : 0}`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('Error fixing links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

fixDiverseLinks()