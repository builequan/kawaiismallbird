#!/usr/bin/env tsx
/**
 * Rebuild internal links with better phrase extraction and similarity
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'

const INDEX_DIR = path.join(process.cwd(), 'data/internal-links')

/**
 * Extract meaningful Japanese phrases from content
 */
function extractMeaningfulPhrases(text: string): string[] {
  const phrases = new Set<string>()
  
  // Clean the text
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Japanese phrase patterns - looking for natural phrases 2-7 characters
  const patterns = [
    // Noun + particle + noun patterns (like "ゴルフのコツ", "スイングの基本")
    /[\u4E00-\u9FAF\u30A0-\u30FF]{2,4}[のでと][\u4E00-\u9FAF\u30A0-\u30FF]{2,4}/g,
    
    // Compound nouns (like "初心者向け", "プロゴルファー")
    /[\u4E00-\u9FAF\u30A0-\u30FF]{4,7}/g,
    
    // Number + counter + noun (like "3つのポイント", "5番アイアン")
    /[0-9０-９]+[つ個本番][のと]?[\u4E00-\u9FAF\u30A0-\u30FF]{2,4}/g,
    
    // Adjective + noun patterns (like "正しいグリップ", "効果的な練習")
    /[\u4E00-\u9FAF]{2,3}[なたいしき][\u4E00-\u9FAF\u30A0-\u30FF]{2,4}/g,
    
    // Verb stem + noun (like "打ち方", "握り方")
    /[\u4E00-\u9FAF]{1,3}[りち]方/g,
    
    // Common golf terms as phrases
    /(?:ドライバー|アイアン|パター|ウェッジ|フェアウェイ|グリーン|バンカー|ティーショット|アプローチ|パッティング)[の]?[\u4E00-\u9FAF\u30A0-\u30FF]{2,4}/g
  ]
  
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(cleanText)) !== null) {
      const phrase = match[0].trim()
      // Filter phrases between 3-10 characters for natural length
      if (phrase.length >= 3 && phrase.length <= 10) {
        // Avoid single repeated characters
        if (!/^(.)\1+$/.test(phrase)) {
          phrases.add(phrase)
        }
      }
    }
  }
  
  // Also look for complete sentence segments that make good anchor text
  // These are typically between punctuation marks
  const segments = cleanText.split(/[。、！？]/g)
  for (const segment of segments) {
    const trimmed = segment.trim()
    if (trimmed.length >= 5 && trimmed.length <= 15) {
      // Check if it contains meaningful content (not just particles)
      if (/[\u4E00-\u9FAF\u30A0-\u30FF]{3,}/.test(trimmed)) {
        phrases.add(trimmed)
      }
    }
  }
  
  // Return up to 50 diverse phrases
  return Array.from(phrases).slice(0, 50)
}

/**
 * Calculate similarity between two posts based on their content
 */
function calculateSimilarity(phrases1: string[], phrases2: string[]): number {
  if (phrases1.length === 0 || phrases2.length === 0) return 0
  
  // Find common phrases
  const set1 = new Set(phrases1)
  const set2 = new Set(phrases2)
  
  let commonCount = 0
  for (const phrase of set1) {
    if (set2.has(phrase)) {
      commonCount++
    }
  }
  
  // Jaccard similarity
  const unionSize = new Set([...phrases1, ...phrases2]).size
  return commonCount / unionSize
}

async function rebuildBetterLinks() {
  console.log('🔄 Rebuilding internal links with better phrase extraction...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: { equals: 'published' }
      }
    })
    
    console.log(`Found ${posts.length} posts to process...`)
    
    // Step 1: Build phrase index for all posts
    console.log('\n📚 Building phrase index...')
    const postPhrases = new Map<string, { title: string; slug: string; phrases: string[] }>()
    
    for (const post of posts) {
      const textContent = extractTextFromContent(post.content)
      const phrases = extractMeaningfulPhrases(textContent)
      
      postPhrases.set(String(post.id), {
        title: post.title,
        slug: post.slug,
        phrases
      })
      
      console.log(`  - ${post.title}: ${phrases.length} phrases extracted`)
    }
    
    // Step 2: Process each post and add internal links
    console.log('\n🔗 Adding internal links based on content similarity...')
    let processedCount = 0
    let skippedCount = 0
    
    for (const post of posts) {
      const postId = String(post.id)
      const currentPhrases = postPhrases.get(postId)?.phrases || []
      
      if (currentPhrases.length === 0) {
        console.log(`⏭️  Skipped: ${post.title} (no phrases found)`)
        skippedCount++
        continue
      }
      
      // Find similar posts
      const similarities: Array<{ id: string; score: number; phrase: string }> = []
      
      for (const [otherId, otherData] of postPhrases) {
        if (otherId === postId) continue // Skip self
        
        const similarity = calculateSimilarity(currentPhrases, otherData.phrases)
        
        if (similarity > 0.1) { // Minimum 10% similarity
          // Find the best matching phrase from current post that relates to the other post
          for (const phrase of currentPhrases) {
            if (otherData.phrases.some(p => p.includes(phrase.substring(0, 3)))) {
              similarities.push({
                id: otherId,
                score: similarity,
                phrase
              })
              break
            }
          }
        }
      }
      
      // Sort by similarity and take top 5
      similarities.sort((a, b) => b.score - a.score)
      const topMatches = similarities.slice(0, 5)
      
      if (topMatches.length === 0) {
        console.log(`⏭️  No similar posts found for: ${post.title}`)
        skippedCount++
        continue
      }
      
      // Apply links to the post
      const updatedContent = applyInternalLinks(post.content, topMatches, postPhrases)
      
      if (updatedContent) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
            internalLinksMetadata: {
              lastProcessed: new Date().toISOString(),
              linksCount: topMatches.length,
              similarPosts: topMatches.map(m => m.id)
            }
          }
        })
        
        console.log(`✅ Added ${topMatches.length} links to: ${post.title}`)
        console.log(`   Phrases linked: ${topMatches.map(m => m.phrase).join(', ')}`)
        processedCount++
      } else {
        skippedCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✨ REBUILD COMPLETE!')
    console.log('='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   • Successfully processed: ${processedCount} posts`)
    console.log(`   • Skipped: ${skippedCount} posts`)
    console.log(`   • Total: ${posts.length} posts`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Error rebuilding links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

/**
 * Extract plain text from Lexical content
 */
function extractTextFromContent(content: any): string {
  if (!content?.root?.children) return ''
  
  const texts: string[] = []
  
  for (const node of content.root.children) {
    if (node.type === 'heading' || node.type === 'paragraph') {
      const nodeText = extractTextFromNode(node)
      if (nodeText) texts.push(nodeText)
    }
  }
  
  return texts.join(' ')
}

/**
 * Extract text from a single node
 */
function extractTextFromNode(node: any): string {
  if (!node.children) return ''
  
  return node.children
    .map((child: any) => {
      if (child.type === 'text') return child.text
      if (child.type === 'link' && child.children?.[0]?.text) {
        return child.children[0].text
      }
      return ''
    })
    .join('')
}

/**
 * Apply internal links to content
 */
function applyInternalLinks(
  content: any,
  matches: Array<{ id: string; score: number; phrase: string }>,
  postPhrases: Map<string, any>
): any {
  if (!content?.root?.children) return null
  
  const updatedContent = JSON.parse(JSON.stringify(content))
  const usedPhrases = new Set<string>()
  let linksAdded = 0
  const maxLinks = 5
  
  // Process each paragraph
  for (const node of updatedContent.root.children) {
    if (node.type === 'paragraph' && node.children && linksAdded < maxLinks) {
      for (let i = 0; i < node.children.length && linksAdded < maxLinks; i++) {
        const child = node.children[i]
        
        if (child.type === 'text' && child.text) {
          // Try to find and replace phrases
          for (const match of matches) {
            if (linksAdded >= maxLinks) break
            if (usedPhrases.has(match.phrase)) continue
            
            const phraseIndex = child.text.indexOf(match.phrase)
            if (phraseIndex !== -1) {
              // Split the text node
              const before = child.text.substring(0, phraseIndex)
              const after = child.text.substring(phraseIndex + match.phrase.length)
              
              const newNodes: any[] = []
              
              if (before) {
                newNodes.push({
                  type: 'text',
                  text: before,
                  format: child.format || 0,
                  version: 1
                })
              }
              
              // Add link node
              newNodes.push({
                type: 'link',
                fields: {
                  linkType: 'internal',
                  doc: {
                    value: match.id,
                    relationTo: 'posts'
                  }
                },
                children: [{
                  type: 'text',
                  text: match.phrase,
                  format: 0,
                  version: 1
                }],
                version: 2
              })
              
              if (after) {
                newNodes.push({
                  type: 'text',
                  text: after,
                  format: child.format || 0,
                  version: 1
                })
              }
              
              // Replace the original node with new nodes
              node.children.splice(i, 1, ...newNodes)
              i += newNodes.length - 1
              
              usedPhrases.add(match.phrase)
              linksAdded++
              break
            }
          }
        }
      }
    }
  }
  
  return linksAdded > 0 ? updatedContent : null
}

// Run the script
rebuildBetterLinks().catch(console.error)