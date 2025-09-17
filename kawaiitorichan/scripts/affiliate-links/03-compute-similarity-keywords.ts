#!/usr/bin/env tsx
/**
 * Compute similarity between posts and affiliate products using keywords only
 * (Fast version without embeddings)
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
  price: string
}

interface PostIndex {
  id: string
  title: string
  slug: string
  content: string
  language: string
  excludeFromAffiliates: boolean
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
 * Calculate keyword match score
 */
function calculateKeywordMatch(post: PostIndex, product: ProductIndex): { score: number; matched: string[] } {
  const matched = new Set<string>()
  let score = 0
  
  const postText = (post.title + ' ' + post.content).toLowerCase()
  
  // Check primary keyword (highest weight)
  if (product.keyword_research) {
    const keyword = product.keyword_research.toLowerCase()
    if (postText.includes(keyword)) {
      matched.add(product.keyword_research)
      score += 0.5
    }
  }
  
  // Check additional keywords with decreasing weights
  const keywordsToCheck = [...product.keywords, ...product.anchorPhrases]
  const uniqueKeywords = Array.from(new Set(keywordsToCheck.map(k => k.toLowerCase())))
  
  for (let i = 0; i < Math.min(uniqueKeywords.length, 5); i++) {
    const keyword = uniqueKeywords[i]
    if (keyword && postText.includes(keyword)) {
      // Find original case version
      const original = keywordsToCheck.find(k => k.toLowerCase() === keyword)
      if (original && !matched.has(original)) {
        matched.add(original)
        // Decreasing score for each additional keyword
        score += 0.3 * (1 / (i + 1))
      }
    }
  }
  
  // Normalize score (max 1.0)
  return { score: Math.min(score, 1.0), matched: Array.from(matched) }
}

/**
 * Check if languages are compatible
 */
function areLanguagesCompatible(postLang: string, productLang: string): boolean {
  if (productLang === 'both') return true
  return postLang === productLang
}

/**
 * Filter products to get diverse keywords
 */
function getDiverseProducts(products: SimilarityResult['relevantProducts']): SimilarityResult['relevantProducts'] {
  const result: SimilarityResult['relevantProducts'] = []
  const usedKeywords = new Set<string>()
  
  for (const product of products) {
    // Check if any matched keyword was already used
    const newKeywords = product.matchedKeywords.filter(k => !usedKeywords.has(k.toLowerCase()))
    
    if (newKeywords.length > 0) {
      // Update matched keywords to only include new ones
      result.push({
        ...product,
        matchedKeywords: newKeywords
      })
      
      // Mark these keywords as used
      newKeywords.forEach(k => usedKeywords.add(k.toLowerCase()))
      
      // Stop if we have enough diverse products
      if (result.length >= 10) break
    }
  }
  
  return result
}

async function main() {
  try {
    console.log('🔍 Computing keyword-based similarity between posts and affiliate products...')
    
    // Load data
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const postsPath = path.join(DATA_DIR, 'posts-index.json')
    
    if (!await fs.access(productsPath).then(() => true).catch(() => false)) {
      console.error('❌ Products index not found. Run 01-build-index.ts first.')
      process.exit(1)
    }
    
    if (!await fs.access(postsPath).then(() => true).catch(() => false)) {
      console.error('❌ Posts index not found. Run 01-build-index.ts first.')
      process.exit(1)
    }
    
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    const posts: PostIndex[] = JSON.parse(await fs.readFile(postsPath, 'utf-8'))
    
    console.log(`📊 Computing similarity for ${posts.length} posts and ${products.length} products`)
    
    const results: SimilarityResult[] = []
    
    // Process each post
    for (const post of posts) {
      // Skip if excluded from affiliates
      if (post.excludeFromAffiliates) {
        console.log(`⏭️  Skipping excluded post: ${post.title}`)
        continue
      }
      
      const relevantProducts: SimilarityResult['relevantProducts'] = []
      
      // Compare with each product
      for (const product of products) {
        // Check language compatibility
        if (!areLanguagesCompatible(post.language, product.language)) {
          continue
        }
        
        // Calculate keyword match score
        const { score: keywordScore, matched } = calculateKeywordMatch(post, product)
        
        // Only include if there are matched keywords
        if (keywordScore > 0 && matched.length > 0) {
          relevantProducts.push({
            productId: product.id,
            productName: product.product_name,
            score: keywordScore,
            matchType: 'keyword',
            matchedKeywords: matched,
          })
        }
      }
      
      // Sort by score and get diverse products
      relevantProducts.sort((a, b) => b.score - a.score)
      const diverseProducts = getDiverseProducts(relevantProducts)
      
      if (diverseProducts.length > 0) {
        results.push({
          postId: post.id,
          postSlug: post.slug,
          relevantProducts: diverseProducts,
        })
        
        console.log(`✅ Found ${diverseProducts.length} diverse products for: ${post.title}`)
        console.log(`   Keywords: ${diverseProducts.map(p => p.matchedKeywords[0]).slice(0, 5).join(', ')}`)
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
      topMatchedProducts: new Map<string, number>(),
      uniqueKeywordsUsed: new Set<string>(),
      timestamp: new Date().toISOString(),
    }
    
    // Calculate statistics
    for (const result of results) {
      for (const product of result.relevantProducts) {
        // Count product usage
        const count = stats.topMatchedProducts.get(product.productName) || 0
        stats.topMatchedProducts.set(product.productName, count + 1)
        
        // Track unique keywords
        product.matchedKeywords.forEach(k => stats.uniqueKeywordsUsed.add(k))
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
      uniqueKeywordsUsed: stats.uniqueKeywordsUsed.size,
    }
    
    await fs.writeFile(
      path.join(DATA_DIR, 'similarity-stats.json'),
      JSON.stringify(statsOutput, null, 2)
    )
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Keyword similarity computation complete!')
    console.log('='.repeat(50))
    console.log(`📝 Posts with products: ${stats.postsWithProducts}/${stats.totalPosts}`)
    console.log(`📊 Average products per post: ${stats.averageProductsPerPost}`)
    console.log(`🔑 Unique keywords used: ${stats.uniqueKeywordsUsed.size}`)
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