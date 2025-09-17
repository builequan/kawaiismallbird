#!/usr/bin/env tsx
/**
 * Debug the full link application process
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

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

function createLinkNode(targetId: string, anchorText: string): any {
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
  
  // Sort by position (to process from end to start) and score
  matches.sort((a, b) => {
    if (a.startOffset !== b.startOffset) {
      return b.startOffset - a.startOffset
    }
    return b.score - a.score
  })
  
  // Remove overlapping matches
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

async function debugFullProcess() {
  const payload = await getPayload({ config: configPromise })
  
  try {
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
    
    // Get test post
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 1,
      where: { title: { contains: '初回ゴルフレッスン' } }
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
    
    // Prepare candidates (simplified)
    const candidates = []
    for (const similar of similarities.similar.slice(0, 3)) {
      const targetPost = postIndexMap.get(similar.id)
      if (!targetPost) continue
      
      const phrases = []
      
      // Add some specific phrases for testing
      phrases.push('ゴルフスイング', 'ゴルファー', 'スイング')
      
      candidates.push({
        id: similar.id,
        slug: similar.slug,
        phrases: phrases.slice(0, 5),
        score: similar.score,
      })
    }
    
    console.log('\nCandidates:', candidates.map(c => ({ slug: c.slug, phrases: c.phrases })))
    
    // Process content
    const newContent = JSON.parse(JSON.stringify(post.content))
    let linksAdded = []
    let totalLinksAdded = 0
    const maxLinks = 2 // Just 2 for testing
    
    if (newContent?.root?.children) {
      console.log('\nProcessing paragraphs...')
      
      for (let nodeIndex = 0; nodeIndex < newContent.root.children.length && totalLinksAdded < maxLinks; nodeIndex++) {
        const node = newContent.root.children[nodeIndex]
        
        if (node.type !== 'paragraph' || !node.children) continue
        
        // Find text nodes
        for (let i = node.children.length - 1; i >= 0 && totalLinksAdded < maxLinks; i--) {
          const child = node.children[i]
          
          if (child.type === 'text' && child.text && !child.text.startsWith('![')) {
            const matches = findAnchorMatches(child.text, candidates)
            
            if (matches.length > 0) {
              console.log(`Found ${matches.length} matches in paragraph ${nodeIndex}`)
              
              // Apply first match only for testing
              const match = matches[0]
              console.log(`Applying match: "${match.anchorText}" → ${match.targetSlug}`)
              
              const beforeText = child.text.substring(0, match.startOffset)
              const afterText = child.text.substring(match.endOffset)
              
              const newNodes = []
              
              if (beforeText) {
                newNodes.push({
                  ...child,
                  text: beforeText,
                })
              }
              
              newNodes.push(createLinkNode(match.targetId, match.anchorText))
              
              if (afterText) {
                newNodes.push({
                  ...child,
                  text: afterText,
                })
              }
              
              // Replace the text node
              node.children.splice(i, 1, ...newNodes)
              
              linksAdded.push({
                targetSlug: match.targetSlug,
                anchorText: match.anchorText,
                position: `paragraph-${nodeIndex}`,
              })
              
              totalLinksAdded++
              break // Only one link per text node
            }
          }
        }
      }
    }
    
    console.log(`\nTotal links added: ${totalLinksAdded}`)
    
    if (totalLinksAdded > 0) {
      console.log('\nAttempting to update post...')
      
      const updated = await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: newContent,
        },
      })
      
      console.log('✓ Update successful!')
      console.log('Links added:', linksAdded)
    } else {
      console.log('No links to add')
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
    if (error.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
    }
    process.exit(1)
  }
  
  process.exit(0)
}

debugFullProcess()