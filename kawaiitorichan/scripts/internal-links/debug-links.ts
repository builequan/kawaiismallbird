#!/usr/bin/env tsx
/**
 * Debug script for testing link application
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

function findAnchorMatches(
  text: string,
  candidates: Array<{ id: string; slug: string; phrases: string[]; score: number }>
) {
  const matches = []
  
  console.log(`\nChecking text: "${text.substring(0, 100)}..."`)
  console.log(`Text length: ${text.length}`)
  
  for (const candidate of candidates) {
    console.log(`\nChecking candidate: ${candidate.slug}`)
    console.log(`  Phrases to check: ${candidate.phrases.slice(0, 5).join(', ')}`)
    
    for (const phrase of candidate.phrases) {
      const isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(phrase)
      
      const index = text.indexOf(phrase)
      if (index !== -1) {
        console.log(`  ✅ FOUND: "${phrase}" at position ${index}`)
        
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
            startOffset: index,
            endOffset: index + phrase.length,
          })
          console.log(`    ✅ Match confirmed!`)
        } else {
          console.log(`    ❌ Word boundary check failed`)
        }
      }
    }
  }
  
  return matches
}

async function debugLinks() {
  const payload = await getPayload({ config: configPromise })
  
  // Load data
  const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
  const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
  
  const indexContent = await fs.readFile(indexPath, 'utf-8')
  const similarityContent = await fs.readFile(similarityPath, 'utf-8')
  
  const indexData = JSON.parse(indexContent)
  const similarityData = JSON.parse(similarityContent)
  
  // Create map
  const postIndexMap = new Map()
  for (const post of indexData.posts) {
    postIndexMap.set(String(post.id), post)
  }
  
  // Get a test post
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 1,
    where: { title: { contains: 'ゴルフレッスン' } }
  })
  
  if (docs.length === 0) {
    console.log('No post found')
    process.exit(1)
  }
  
  const post = docs[0]
  console.log('Testing with post:', post.title)
  console.log('Post ID:', post.id)
  
  // Get similarities
  const similarities = similarityData.similarities[post.id]
  if (!similarities || similarities.similar.length === 0) {
    console.log('No similar posts found')
    process.exit(1)
  }
  
  // Prepare candidates with improved logic
  const candidates = []
  for (const similar of similarities.similar.slice(0, 3)) {
    const targetPost = postIndexMap.get(similar.id)
    if (!targetPost) continue
    
    const phrases = []
    const title = targetPost.title
    
    // Add specific parts of title if it contains colon
    if (title.includes('：')) {
      const parts = title.split('：')
      parts.forEach(part => {
        const cleaned = part.trim()
        if (cleaned.length >= 3 && cleaned.length < 30) {
          phrases.push(cleaned)
        }
      })
    }
    
    // Add filtered anchor phrases
    const anchorPhrases = targetPost.anchorPhrases
      .filter(p => {
        if (p === 'ゴルフ' || p === 'golf' || p === 'images' || p.length < 3) {
          return false
        }
        return true
      })
      .slice(0, 10)
    
    phrases.push(...anchorPhrases)
    
    // Sort by length (longer = more specific)
    const sortedPhrases = [...new Set(phrases)]
      .filter(p => p && p.length >= 3)
      .sort((a, b) => b.length - a.length)
    
    candidates.push({
      id: similar.id,
      slug: similar.slug,
      phrases: sortedPhrases,
      score: similar.score,
    })
  }
  
  console.log('\n=== Candidates Prepared ===')
  candidates.forEach(c => {
    console.log(`\n${c.slug}`)
    console.log(`  Top phrases: ${c.phrases.slice(0, 5).join(', ')}`)
  })
  
  // Test with actual paragraph text
  console.log('\n=== Testing Paragraph Matching ===')
  
  if (post.content?.root?.children) {
    let paragraphCount = 0
    
    for (const node of post.content.root.children) {
      if (node.type === 'paragraph' && node.children) {
        for (const child of node.children) {
          if (child.type === 'text' && child.text && !child.text.startsWith('![')) {
            paragraphCount++
            console.log(`\n--- Paragraph ${paragraphCount} ---`)
            
            const matches = findAnchorMatches(child.text, candidates)
            
            if (matches.length > 0) {
              console.log(`\n🎉 Found ${matches.length} matches!`)
              matches.forEach(m => {
                console.log(`  - "${m.anchorText}" -> ${m.targetSlug}`)
              })
            } else {
              console.log('  No matches found in this paragraph')
            }
            
            if (paragraphCount >= 5) break
          }
        }
      }
      if (paragraphCount >= 5) break
    }
  }
  
  process.exit(0)
}

debugLinks()