#!/usr/bin/env tsx
/**
 * DEBUG version - Compute similarity matrix showing exact IDs
 */

import fs from 'fs/promises'
import path from 'path'

interface PostIndex {
  id: string
  title: string
  slug: string
  language: 'ja' | 'en'
}

interface IndexData {
  posts: PostIndex[]
  timestamp: string
}

interface EmbeddingData {
  model: string
  dimension: number
  embeddings: { [postId: string]: number[] }
  timestamp: string
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0
  }
  
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }
  
  norm1 = Math.sqrt(norm1)
  norm2 = Math.sqrt(norm2)
  
  if (norm1 === 0 || norm2 === 0) {
    return 0
  }
  
  return dotProduct / (norm1 * norm2)
}

async function computeSimilarity() {
  console.log('🔍 DEBUG: Computing similarity matrix...')
  
  try {
    // Load data
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const embeddingPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    
    console.log('Reading from:', indexPath)
    console.log('Reading from:', embeddingPath)
    
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const embeddingContent = await fs.readFile(embeddingPath, 'utf-8')
    
    const indexData: IndexData = JSON.parse(indexContent)
    const embeddingData: EmbeddingData = JSON.parse(embeddingContent)
    
    console.log('Index has', indexData.posts.length, 'posts')
    console.log('First 3 index IDs:', indexData.posts.slice(0, 3).map(p => p.id))
    console.log('Embeddings has', Object.keys(embeddingData.embeddings).length, 'embeddings')
    console.log('First 3 embedding IDs:', Object.keys(embeddingData.embeddings).slice(0, 3))
    
    // Filter posts that have embeddings
    const postsWithEmbeddings = indexData.posts.filter(post => 
      embeddingData.embeddings[post.id] !== undefined
    )
    
    console.log(`\nFiltered to ${postsWithEmbeddings.length} posts with embeddings`)
    console.log('First 3 filtered IDs:', postsWithEmbeddings.slice(0, 3).map(p => p.id))
    console.log('First 3 filtered slugs:', postsWithEmbeddings.slice(0, 3).map(p => p.slug))
    
    // Compute similarity matrix
    const similarityThreshold = 0.3
    const maxSimilar = 20
    
    const similarities: { [postId: string]: { slug: string; similar: Array<{ id: string; slug: string; score: number }> } } = {}
    
    // Process just first 3 posts for debugging
    for (const post of postsWithEmbeddings.slice(0, 3)) {
      console.log(`\nProcessing post ID ${post.id} (${post.slug})`)
      
      const postEmbedding = embeddingData.embeddings[post.id]
      if (!postEmbedding) {
        console.log('  ⚠️ No embedding found!')
        continue
      }
      
      const similarPosts: Array<{ id: string; slug: string; score: number }> = []
      
      // Compare with all other posts
      for (const otherPost of postsWithEmbeddings) {
        if (post.id === otherPost.id) continue
        
        const otherEmbedding = embeddingData.embeddings[otherPost.id]
        if (!otherEmbedding) continue
        
        const similarity = cosineSimilarity(postEmbedding, otherEmbedding)
        
        if (similarity >= similarityThreshold) {
          similarPosts.push({
            id: otherPost.id,
            slug: otherPost.slug,
            score: similarity
          })
        }
      }
      
      // Sort by similarity
      similarPosts.sort((a, b) => b.score - a.score)
      
      console.log(`  Found ${similarPosts.length} similar posts`)
      console.log(`  Top 3 similar:`, similarPosts.slice(0, 3).map(p => `${p.id} (${p.score.toFixed(3)})`))
      
      // CRITICAL: Show what key we're using
      const key = post.id
      console.log(`  💾 Storing with key: "${key}"`)
      
      similarities[key] = {
        slug: post.slug,
        similar: similarPosts.slice(0, maxSimilar)
      }
    }
    
    console.log('\n📊 Final similarities object keys:', Object.keys(similarities))
    
    // Save similarity matrix
    const outputPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    await fs.writeFile(
      outputPath,
      JSON.stringify({
        threshold: similarityThreshold,
        similarities,
        timestamp: new Date().toISOString()
      }, null, 2)
    )
    
    console.log(`\n✅ Saved to: ${outputPath}`)
    
    // Verify what was written
    const written = await fs.readFile(outputPath, 'utf-8')
    const writtenData = JSON.parse(written)
    console.log('Verified written keys:', Object.keys(writtenData.similarities))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

computeSimilarity().catch(console.error)