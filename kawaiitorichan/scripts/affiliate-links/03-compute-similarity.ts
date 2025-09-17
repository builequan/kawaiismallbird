#!/usr/bin/env tsx
/**
 * Compute similarity between posts and affiliate products
 * Uses both keyword matching and semantic similarity
 */

import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  anchorPhrases: string[]
  language: string
}

interface PostIndex {
  id: string
  title: string
  slug: string
  content: string
  language: string
  excludeFromAffiliates: boolean
}

interface EmbeddingData {
  id: string
  embedding: number[]
  type: 'product' | 'post'
  language: string
}

interface SimilarityResult {
  postId: string
  postSlug: string
  relevantProducts: Array<{
    productId: string
    productName: string
    score: number
    matchType: 'keyword' | 'semantic' | 'both'
    matchedKeywords: string[]
  }>
}

/**
 * Compute cosine similarity between two embeddings
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0
  
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i]
    norm1 += vec1[i] * vec1[i]
    norm2 += vec2[i] * vec2[i]
  }
  
  if (norm1 === 0 || norm2 === 0) return 0
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Calculate keyword match score
 */
function calculateKeywordMatch(post: PostIndex, product: ProductIndex): { score: number; matched: string[] } {
  const matched: string[] = []
  let score = 0
  
  const postText = (post.title + ' ' + post.content).toLowerCase()
  
  // Check primary keyword (highest weight)
  if (product.keyword_research && postText.includes(product.keyword_research.toLowerCase())) {
    matched.push(product.keyword_research)
    score += 0.4
  }
  
  // Check additional keywords
  for (const keyword of product.keywords) {
    if (postText.includes(keyword.toLowerCase())) {
      matched.push(keyword)
      score += 0.2
    }
  }
  
  // Check anchor phrases
  for (const phrase of product.anchorPhrases) {
    if (postText.includes(phrase.toLowerCase())) {
      if (!matched.includes(phrase)) {
        matched.push(phrase)
        score += 0.1
      }
    }
  }
  
  // Normalize score (max 1.0)
  return { score: Math.min(score, 1.0), matched }
}

/**
 * Check if languages are compatible
 */
function areLanguagesCompatible(postLang: string, productLang: string): boolean {
  if (productLang === 'both') return true
  return postLang === productLang
}

async function main() {
  try {
    console.log('🔍 Computing similarity between posts and affiliate products...')
    
    // Load data
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const postsPath = path.join(DATA_DIR, 'posts-index.json')
    const embeddingsPath = path.join(DATA_DIR, 'embeddings.json')
    
    if (!await fs.access(embeddingsPath).then(() => true).catch(() => false)) {
      console.error('❌ Embeddings not found. Run 02-generate-embeddings.ts first.')
      process.exit(1)
    }
    
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    const posts: PostIndex[] = JSON.parse(await fs.readFile(postsPath, 'utf-8'))
    const embeddings: EmbeddingData[] = JSON.parse(await fs.readFile(embeddingsPath, 'utf-8'))
    
    // Create embedding lookup maps
    const productEmbeddings = new Map<string, number[]>()
    const postEmbeddings = new Map<string, number[]>()
    
    for (const emb of embeddings) {
      if (emb.type === 'product') {
        productEmbeddings.set(emb.id, emb.embedding)
      } else {
        postEmbeddings.set(emb.id, emb.embedding)
      }
    }
    
    console.log(`📊 Computing similarity for ${posts.length} posts and ${products.length} products`)
    
    const results: SimilarityResult[] = []
    
    // Process each post
    for (const post of posts) {
      // Skip if excluded from affiliates
      if (post.excludeFromAffiliates) {
        console.log(`⏭️  Skipping excluded post: ${post.title}`)
        continue
      }
      
      const postEmbedding = postEmbeddings.get(post.id)
      if (!postEmbedding) {
        console.log(`⚠️  No embedding found for post: ${post.title}`)
        continue
      }
      
      const relevantProducts: SimilarityResult['relevantProducts'] = []
      
      // Compare with each product
      for (const product of products) {
        // Check language compatibility
        if (!areLanguagesCompatible(post.language, product.language)) {
          continue
        }
        
        const productEmbedding = productEmbeddings.get(product.id)
        if (!productEmbedding) continue
        
        // Calculate keyword match score (40% weight)
        const { score: keywordScore, matched } = calculateKeywordMatch(post, product)
        
        // Calculate semantic similarity (60% weight)
        const semanticScore = cosineSimilarity(postEmbedding, productEmbedding)
        
        // Calculate combined score
        const combinedScore = (keywordScore * 0.4) + (semanticScore * 0.6)
        
        // Determine match type
        let matchType: 'keyword' | 'semantic' | 'both' = 'semantic'
        if (keywordScore > 0 && semanticScore > 0.3) {
          matchType = 'both'
        } else if (keywordScore > semanticScore) {
          matchType = 'keyword'
        }
        
        // Only include if score is above threshold
        const threshold = 0.3
        if (combinedScore >= threshold || keywordScore >= 0.4) {
          relevantProducts.push({
            productId: product.id,
            productName: product.product_name,
            score: combinedScore,
            matchType,
            matchedKeywords: matched,
          })
        }
      }
      
      // Sort by score and keep top 10
      relevantProducts.sort((a, b) => b.score - a.score)
      const topProducts = relevantProducts.slice(0, 10)
      
      if (topProducts.length > 0) {
        results.push({
          postId: post.id,
          postSlug: post.slug,
          relevantProducts: topProducts,
        })
        
        console.log(`✅ Found ${topProducts.length} products for: ${post.title}`)
      } else {
        console.log(`⚠️  No relevant products for: ${post.title}`)
      }
    }
    
    // Save similarity results
    const outputPath = path.join(DATA_DIR, 'similarity-matrix.json')
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2))
    
    // Generate statistics
    const stats = {
      totalPosts: posts.length,
      postsWithProducts: results.length,
      postsWithoutProducts: posts.length - results.length,
      averageProductsPerPost: results.length > 0 
        ? (results.reduce((sum, r) => sum + r.relevantProducts.length, 0) / results.length).toFixed(2)
        : 0,
      matchTypeDistribution: {
        keyword: 0,
        semantic: 0,
        both: 0,
      },
      topMatchedProducts: new Map<string, number>(),
      timestamp: new Date().toISOString(),
    }
    
    // Calculate match type distribution and top products
    for (const result of results) {
      for (const product of result.relevantProducts) {
        stats.matchTypeDistribution[product.matchType]++
        
        const count = stats.topMatchedProducts.get(product.productName) || 0
        stats.topMatchedProducts.set(product.productName, count + 1)
      }
    }
    
    // Get top 10 most matched products
    const topProducts = Array.from(stats.topMatchedProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    
    const statsOutput = {
      ...stats,
      topMatchedProducts: topProducts,
    }
    
    await fs.writeFile(
      path.join(DATA_DIR, 'similarity-stats.json'),
      JSON.stringify(statsOutput, null, 2)
    )
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Similarity computation complete!')
    console.log('='.repeat(50))
    console.log(`📝 Posts with products: ${stats.postsWithProducts}/${stats.totalPosts}`)
    console.log(`📊 Average products per post: ${stats.averageProductsPerPost}`)
    console.log(`🔍 Match types:`)
    console.log(`   - Keyword only: ${stats.matchTypeDistribution.keyword}`)
    console.log(`   - Semantic only: ${stats.matchTypeDistribution.semantic}`)
    console.log(`   - Both: ${stats.matchTypeDistribution.both}`)
    console.log(`🏆 Top matched products:`)
    topProducts.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name}: ${p.count} posts`)
    })
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error computing similarity:', error)
    process.exit(1)
  }
}

main().catch(console.error)