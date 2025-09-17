#!/usr/bin/env tsx
/**
 * Compute similarity matrix between all posts
 */

import fs from 'fs/promises'
import path from 'path'

interface PostIndex {
  id: string
  slug: string
  title: string
  categories: string[]
  tags: string[]
  language: string
  keywords: string[]
}

interface IndexData {
  posts: PostIndex[]
}

interface EmbeddingData {
  embeddings: {
    [postId: string]: {
      slug: string
      embedding: number[]
    }
  }
}

interface SimilarityData {
  version: string
  generatedAt: string
  threshold: number
  similarities: {
    [postId: string]: {
      slug: string
      similar: Array<{
        id: string
        slug: string
        score: number
        categoryOverlap: number
        tagOverlap: number
      }>
    }
  }
}

/**
 * Compute cosine similarity between two embeddings
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same dimension')
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

/**
 * Calculate overlap between two arrays (categories or tags)
 */
function calculateOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) {
    return 0
  }
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()))
  const set2 = new Set(arr2.map(s => s.toLowerCase()))
  
  let overlap = 0
  for (const item of set1) {
    if (set2.has(item)) {
      overlap++
    }
  }
  
  // Return Jaccard similarity
  const union = new Set([...set1, ...set2]).size
  return union > 0 ? overlap / union : 0
}

/**
 * Compute combined similarity score
 */
function computeCombinedScore(
  embeddingSimilarity: number,
  categoryOverlap: number,
  tagOverlap: number,
  sameLanguage: boolean
): number {
  // Weight the different factors - emphasize embedding similarity more
  const weights = {
    embedding: 0.8,      // 80% weight to semantic similarity
    category: 0.1,       // 10% weight to category overlap
    tag: 0.05,          // 5% weight to tag overlap
    language: 0.05,     // 5% bonus for same language
  }
  
  let score = embeddingSimilarity * weights.embedding
  score += categoryOverlap * weights.category
  score += tagOverlap * weights.tag
  
  if (sameLanguage) {
    score += weights.language
  }
  
  return Math.min(1, score) // Cap at 1.0
}

async function computeSimilarity() {
  console.log('Computing similarity matrix for posts...')
  
  try {
    // Load post index
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const indexData: IndexData = JSON.parse(indexContent)
    
    // Load embeddings
    const embeddingsPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    const embeddingsContent = await fs.readFile(embeddingsPath, 'utf-8')
    const embeddingData: EmbeddingData = JSON.parse(embeddingsContent)
    
    console.log(`Computing similarities for ${indexData.posts.length} posts...`)
    
    const similarityData: SimilarityData = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      threshold: 0.1, // Minimum similarity score to consider (lowered for better matching)
      similarities: {},
    }
    
    // Create a map for quick post lookup (using string IDs)
    const postMap = new Map<string, PostIndex>()
    for (const post of indexData.posts) {
      postMap.set(String(post.id), post)
    }
    
    // Compute pairwise similarities
    const postIds = Object.keys(embeddingData.embeddings)
    const totalPairs = (postIds.length * (postIds.length - 1)) / 2
    let processed = 0
    
    for (let i = 0; i < postIds.length; i++) {
      const postId1 = postIds[i]
      const post1 = postMap.get(postId1)
      const embedding1 = embeddingData.embeddings[postId1]
      
      if (!post1 || !embedding1) continue
      
      const similarities: Array<{
        id: string
        slug: string
        score: number
        categoryOverlap: number
        tagOverlap: number
      }> = []
      
      for (let j = 0; j < postIds.length; j++) {
        if (i === j) continue // Skip self
        
        const postId2 = postIds[j]
        const post2 = postMap.get(postId2)
        const embedding2 = embeddingData.embeddings[postId2]
        
        if (!post2 || !embedding2) continue
        
        // Compute embedding similarity
        const embeddingSim = cosineSimilarity(
          embedding1.embedding,
          embedding2.embedding
        )
        
        // Compute category and tag overlap
        const categoryOverlap = calculateOverlap(post1.categories, post2.categories)
        const tagOverlap = calculateOverlap(post1.tags, post2.tags)
        
        // Check if same language
        const sameLanguage = post1.language === post2.language
        
        // Compute combined score
        const combinedScore = computeCombinedScore(
          embeddingSim,
          categoryOverlap,
          tagOverlap,
          sameLanguage
        )
        
        // Only include if above threshold
        if (combinedScore >= similarityData.threshold) {
          similarities.push({
            id: postId2,
            slug: post2.slug,
            score: combinedScore,
            categoryOverlap,
            tagOverlap,
          })
        }
        
        if (i < j) {
          processed++
          if (processed % 100 === 0) {
            const progress = Math.round((processed / totalPairs) * 100)
            console.log(`Progress: ${progress}% (${processed}/${totalPairs} pairs)`)
          }
        }
      }
      
      // Sort by score (descending) and keep top 20
      similarities.sort((a, b) => b.score - a.score)
      
      similarityData.similarities[postId1] = {
        slug: post1.slug,
        similar: similarities.slice(0, 20), // Keep top 20 similar posts
      }
    }
    
    // Save similarity matrix
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    await fs.writeFile(similarityPath, JSON.stringify(similarityData, null, 2))
    
    console.log(`\n✅ Similarity matrix computed successfully!`)
    console.log(`📁 Saved to: ${similarityPath}`)
    console.log(`📊 Total posts processed: ${postIds.length}`)
    console.log(`🔗 Threshold: ${similarityData.threshold}`)
    
    // Show statistics
    const avgSimilarPosts = Object.values(similarityData.similarities)
      .reduce((sum, item) => sum + item.similar.length, 0) / postIds.length
    
    console.log(`\n📈 Statistics:`)
    console.log(`  - Average similar posts per post: ${avgSimilarPosts.toFixed(1)}`)
    
    // Show top similarities for first few posts
    const samplePosts = Object.keys(similarityData.similarities).slice(0, 3)
    console.log('\n🔍 Sample similarities:')
    for (const postId of samplePosts) {
      const item = similarityData.similarities[postId]
      const topSimilar = item.similar.slice(0, 3)
      console.log(`\n  ${item.slug}:`)
      for (const similar of topSimilar) {
        console.log(`    - ${similar.slug} (score: ${similar.score.toFixed(3)})`)
      }
    }
    
  } catch (error) {
    console.error('Error computing similarity:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run if called directly
computeSimilarity()