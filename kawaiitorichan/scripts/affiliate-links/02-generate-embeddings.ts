#!/usr/bin/env tsx
/**
 * Generate embeddings for affiliate products and posts
 * Uses Python embedding service if available, fallback to JavaScript
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { execFile as execFileCb } from 'child_process'
import { promisify } from 'util'

const execFile = promisify(execFileCb)

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  description: string
  language: string
  anchorPhrases: string[]
}

interface PostIndex {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  language: string
}

interface EmbeddingData {
  id: string
  text: string
  embedding: number[]
  type: 'product' | 'post'
  language: string
}

/**
 * Generate text for embedding from product data
 */
function getProductEmbeddingText(product: ProductIndex): string {
  // Combine relevant fields for semantic representation
  const parts = [
    product.product_name,
    product.keyword_research,
    ...product.keywords,
    product.description,
    ...product.anchorPhrases,
  ]
  
  return parts.filter(Boolean).join(' ')
}

/**
 * Generate text for embedding from post data
 */
function getPostEmbeddingText(post: PostIndex): string {
  // Combine title, excerpt, and content preview
  const parts = [
    post.title,
    post.excerpt || '',
    post.content.substring(0, 2000), // Use first 2000 chars
  ]
  
  return parts.filter(Boolean).join(' ')
}

/**
 * Call Python embedding service
 */
async function generateEmbeddingsPython(texts: string[]): Promise<number[][]> {
  try {
    const input = JSON.stringify({ texts })
    const { stdout } = await execFile('python3', [
      path.join(process.cwd(), 'scripts', 'internal-links', 'embedding-service.py'),
      'embed_batch',
      input
    ])
    
    const result = JSON.parse(stdout)
    if (result.error) {
      throw new Error(result.error)
    }
    
    return result.embeddings
  } catch (error) {
    console.log('⚠️  Python embedding service not available, using fallback')
    return generateEmbeddingsFallback(texts)
  }
}

/**
 * Fallback: Generate simple TF-IDF-like embeddings in JavaScript
 */
function generateEmbeddingsFallback(texts: string[]): number[][] {
  // Create vocabulary from all texts
  const vocabulary = new Map<string, number>()
  let vocabIndex = 0
  
  // Tokenize all texts and build vocabulary
  const tokenizedTexts = texts.map(text => {
    const tokens = text.toLowerCase()
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1)
    
    tokens.forEach(token => {
      if (!vocabulary.has(token)) {
        vocabulary.set(token, vocabIndex++)
      }
    })
    
    return tokens
  })
  
  // Generate embeddings (simple TF vectors)
  const embeddingSize = Math.min(384, vocabulary.size)
  const embeddings: number[][] = []
  
  for (const tokens of tokenizedTexts) {
    const embedding = new Array(embeddingSize).fill(0)
    const tokenCounts = new Map<string, number>()
    
    // Count tokens
    tokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1)
    })
    
    // Fill embedding vector
    tokenCounts.forEach((count, token) => {
      const index = vocabulary.get(token)
      if (index !== undefined && index < embeddingSize) {
        embedding[index] = count / tokens.length // Normalize by document length
      }
    })
    
    // Normalize vector
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }
    
    embeddings.push(embedding)
  }
  
  return embeddings
}

async function main() {
  try {
    console.log('🧮 Generating embeddings for affiliate products and posts...')
    
    // Load indices
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
    
    console.log(`📦 Processing ${products.length} products`)
    console.log(`📝 Processing ${posts.length} posts`)
    
    // Prepare texts for embedding
    const productTexts = products.map(getProductEmbeddingText)
    const postTexts = posts.map(getPostEmbeddingText)
    const allTexts = [...productTexts, ...postTexts]
    
    console.log('🔄 Generating embeddings...')
    
    // Generate embeddings in batches
    const batchSize = 100
    const allEmbeddings: number[][] = []
    
    for (let i = 0; i < allTexts.length; i += batchSize) {
      const batch = allTexts.slice(i, Math.min(i + batchSize, allTexts.length))
      const batchEmbeddings = await generateEmbeddingsPython(batch)
      allEmbeddings.push(...batchEmbeddings)
      
      const progress = Math.min(i + batchSize, allTexts.length)
      console.log(`   Processed ${progress}/${allTexts.length} items`)
    }
    
    // Split embeddings back into products and posts
    const productEmbeddings = allEmbeddings.slice(0, products.length)
    const postEmbeddings = allEmbeddings.slice(products.length)
    
    // Create embedding data
    const embeddingData: EmbeddingData[] = []
    
    // Add product embeddings
    products.forEach((product, index) => {
      embeddingData.push({
        id: product.id,
        text: productTexts[index].substring(0, 500), // Store text preview
        embedding: productEmbeddings[index],
        type: 'product',
        language: product.language,
      })
    })
    
    // Add post embeddings
    posts.forEach((post, index) => {
      embeddingData.push({
        id: post.id,
        text: postTexts[index].substring(0, 500), // Store text preview
        embedding: postEmbeddings[index],
        type: 'post',
        language: post.language,
      })
    })
    
    // Save embeddings
    const outputPath = path.join(DATA_DIR, 'embeddings.json')
    await fs.writeFile(outputPath, JSON.stringify(embeddingData, null, 2))
    
    // Save metadata
    const metadata = {
      totalEmbeddings: embeddingData.length,
      productEmbeddings: products.length,
      postEmbeddings: posts.length,
      embeddingDimension: allEmbeddings[0]?.length || 0,
      generatedAt: new Date().toISOString(),
    }
    
    await fs.writeFile(
      path.join(DATA_DIR, 'embeddings-metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Embeddings generated successfully!')
    console.log('='.repeat(50))
    console.log(`📊 Total embeddings: ${embeddingData.length}`)
    console.log(`📦 Product embeddings: ${products.length}`)
    console.log(`📝 Post embeddings: ${posts.length}`)
    console.log(`📏 Embedding dimension: ${metadata.embeddingDimension}`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error generating embeddings:', error)
    process.exit(1)
  }
}

main().catch(console.error)