#!/usr/bin/env tsx
/**
 * Compute similarity matrix for posts based on embeddings (fixed version)
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

/**
 * Compute cosine similarity between two vectors
 */
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
  console.log('Computing similarity matrix for posts (fixed version)...')
  
  try {
    // Load data
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const embeddingPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const embeddingContent = await fs.readFile(embeddingPath, 'utf-8')
    
    const indexData: IndexData = JSON.parse(indexContent)
    const embeddingData: EmbeddingData = JSON.parse(embeddingContent)
    
    // Filter posts that have embeddings
    const postsWithEmbeddings = indexData.posts.filter(post => 
      embeddingData.embeddings[post.id] !== undefined
    )
    
    console.log(`Computing similarities for ${postsWithEmbeddings.length} posts with embeddings...`)
    
    // Compute similarity matrix
    const similarityThreshold = 0.3 // Minimum similarity to consider
    const maxSimilar = 20 // Maximum number of similar posts to keep
    
    const similarities: { [postId: string]: { slug: string; similar: Array<{ id: string; slug: string; score: number }> } } = {}
    
    for (const post of postsWithEmbeddings) {
      const postEmbedding = embeddingData.embeddings[post.id]
      if (!postEmbedding) continue
      
      const similarPosts: Array<{ id: string; slug: string; score: number }> = []
      
      // Compare with all other posts
      for (const otherPost of postsWithEmbeddings) {
        // Skip self-comparison
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
      
      // Sort by similarity and keep top N
      similarPosts.sort((a, b) => b.score - a.score)
      
      similarities[post.id] = {
        slug: post.slug,
        similar: similarPosts.slice(0, maxSimilar)
      }
      
      if (similarPosts.length > 0) {
        console.log(`✓ ${post.title}: Found ${similarPosts.length} similar posts`)
      }
    }
    
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
    
    console.log('\n✅ Similarity matrix computed successfully!')
    console.log(`📁 Saved to: ${outputPath}`)
    console.log(`📊 Total posts processed: ${Object.keys(similarities).length}`)
    
    // Statistics
    const withSimilar = Object.values(similarities).filter(s => s.similar.length > 0).length
    const avgSimilar = Object.values(similarities).reduce((sum, s) => sum + s.similar.length, 0) / Math.max(Object.keys(similarities).length, 1)
    
    console.log('\n📈 Statistics:')
    console.log(`  - Posts with similar content: ${withSimilar}`)
    console.log(`  - Average similar posts per post: ${Math.round(avgSimilar)}`)
    
  } catch (error) {
    console.error('Error computing similarity:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

computeSimilarity().catch(console.error)