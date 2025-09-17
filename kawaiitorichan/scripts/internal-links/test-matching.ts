#!/usr/bin/env tsx
/**
 * Test script to debug anchor text matching
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

async function testMatching() {
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
  
  // Get similar posts
  const similarities = similarityData.similarities[post.id]
  if (!similarities || similarities.similar.length === 0) {
    console.log('No similar posts found')
    process.exit(1)
  }
  
  console.log('\nTop similar posts:')
  similarities.similar.slice(0, 3).forEach(s => {
    const targetPost = postIndexMap.get(s.id)
    if (targetPost) {
      console.log(`- ${targetPost.title} (score: ${s.score.toFixed(3)})`)
    }
  })
  
  // Get actual text from post
  let testText = ''
  if (post.content?.root?.children) {
    for (const node of post.content.root.children) {
      if (node.type === 'paragraph' && node.children) {
        for (const child of node.children) {
          if (child.type === 'text' && child.text && !child.text.startsWith('![')) {
            if (child.text.includes('ゴルフ')) {
              testText = child.text
              break
            }
          }
        }
      }
      if (testText) break
    }
  }
  
  console.log('\nTest text:')
  console.log(testText)
  
  // Prepare candidates
  const candidates = []
  for (const similar of similarities.similar.slice(0, 5)) {
    const targetPost = postIndexMap.get(similar.id)
    if (!targetPost) continue
    
    const phrases = []
    
    // Extract key terms from title
    const title = targetPost.title
    
    // Simple extraction of Japanese golf terms
    const commonTerms = ['ゴルフ', 'スイング', 'クラブ', 'ボール', 'パット', 'ドライバー', '初心者', '練習', 'レッスン']
    for (const term of commonTerms) {
      if (title.includes(term)) {
        phrases.push(term)
      }
    }
    
    // Add some anchor phrases
    phrases.push(...targetPost.anchorPhrases.slice(0, 10))
    
    candidates.push({
      id: similar.id,
      slug: similar.slug,
      title: targetPost.title,
      phrases: [...new Set(phrases)].filter(p => p && p.length >= 2),
      score: similar.score
    })
  }
  
  console.log('\nCandidates prepared:')
  candidates.forEach(c => {
    console.log(`\n${c.title}`)
    console.log(`  Phrases to match: ${c.phrases.slice(0, 5).join(', ')}`)
  })
  
  // Try to find matches
  console.log('\n=== Matching Test ===')
  for (const candidate of candidates) {
    for (const phrase of candidate.phrases) {
      if (testText.includes(phrase)) {
        console.log(`✅ MATCH FOUND: "${phrase}" in text`)
        console.log(`   Target: ${candidate.title}`)
        const index = testText.indexOf(phrase)
        console.log(`   Context: ...${testText.substring(Math.max(0, index - 20), index + phrase.length + 20)}...`)
        break
      }
    }
  }
  
  process.exit(0)
}

testMatching()