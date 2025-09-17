#!/usr/bin/env tsx
/**
 * Generate embeddings for all posts using Python service or fallback
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PostIndex {
  id: string
  slug: string
  title: string
  excerpt: string
  contentSummary: string
  categories: string[]
  tags: string[]
  language: string
  keywords: string[]
  anchorPhrases: string[]
  publishedAt: string | null
  contentHash: string
}

interface IndexData {
  version: string
  generatedAt: string
  posts: PostIndex[]
}

interface EmbeddingData {
  version: string
  generatedAt: string
  model: string
  dimension: number
  embeddings: {
    [postId: string]: {
      slug: string
      embedding: number[]
      textHash: string
    }
  }
}

/**
 * Call Python embedding service
 */
async function callPythonService(command: string, input?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'embedding-service.py')
    const python = spawn('python3', [pythonScript, command])
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python service failed: ${stderr}`))
      } else {
        try {
          const result = JSON.parse(stdout)
          if (result.error) {
            reject(new Error(result.error))
          } else {
            resolve(result)
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`))
        }
      }
    })
    
    python.on('error', (err) => {
      reject(new Error(`Failed to start Python service: ${err.message}`))
    })
    
    // Send input if provided
    if (input !== undefined) {
      python.stdin.write(JSON.stringify(input))
      python.stdin.end()
    }
  })
}

/**
 * Fallback: Generate simple TF-IDF-like embeddings in JavaScript
 */
function generateSimpleEmbedding(text: string, dimension: number = 384): number[] {
  // This is a very simple fallback - just creates a deterministic vector from text
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0)
  const embedding = new Array(dimension).fill(0)
  
  // Create a simple hash-based embedding
  for (const word of words) {
    const hash = crypto.createHash('md5').update(word).digest()
    for (let i = 0; i < Math.min(hash.length, dimension); i++) {
      embedding[i] += hash[i] / 255.0 / words.length
    }
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm
    }
  }
  
  return embedding
}

/**
 * Prepare text for embedding
 */
function prepareTextForEmbedding(post: PostIndex): string {
  // Combine title, excerpt, and summary for richer embedding
  const parts = [
    post.title,
    post.excerpt,
    post.contentSummary,
    post.categories.join(' '),
    post.tags.join(' '),
    post.keywords.slice(0, 10).join(' ')
  ]
  
  return parts.filter(Boolean).join(' ')
}

async function generateEmbeddings() {
  console.log('Generating embeddings for posts...')
  
  try {
    // Load post index
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const indexData: IndexData = JSON.parse(indexContent)
    
    console.log(`Loading ${indexData.posts.length} posts from index...`)
    
    // Check if Python service is available
    let usePython = false
    let modelInfo: any = { model: 'simple-js', embedding_dim: 384 }
    
    try {
      modelInfo = await callPythonService('info')
      usePython = true
      console.log(`✓ Using Python embedding service: ${modelInfo.model}`)
    } catch (error) {
      console.log('⚠️  Python service not available, using JavaScript fallback')
    }
    
    const embeddingData: EmbeddingData = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      model: modelInfo.model || 'simple-js',
      dimension: modelInfo.embedding_dim || 384,
      embeddings: {},
    }
    
    // Prepare all texts
    const texts = indexData.posts.map(post => prepareTextForEmbedding(post))
    
    let embeddings: number[][]
    
    if (usePython) {
      // Generate embeddings in batch using Python
      console.log('Generating embeddings using Python service...')
      const result = await callPythonService('embed_batch', texts)
      embeddings = result.embeddings
    } else {
      // Generate embeddings using JavaScript fallback
      console.log('Generating embeddings using JavaScript fallback...')
      embeddings = texts.map(text => generateSimpleEmbedding(text, embeddingData.dimension))
    }
    
    // Store embeddings
    for (let i = 0; i < indexData.posts.length; i++) {
      const post = indexData.posts[i]
      const embedding = embeddings[i]
      const textHash = crypto.createHash('md5').update(texts[i]).digest('hex')
      
      // Make sure we use the string version of the post ID
      const postId = String(post.id)
      
      embeddingData.embeddings[postId] = {
        slug: post.slug,
        embedding,
        textHash,
      }
      
      console.log(`✓ Generated embedding for: ${post.title} (ID: ${postId})`)
    }
    
    // Save embeddings to file
    const embeddingsPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    await fs.writeFile(embeddingsPath, JSON.stringify(embeddingData, null, 2))
    
    console.log(`\n✅ Embeddings generated successfully!`)
    console.log(`📁 Saved to: ${embeddingsPath}`)
    console.log(`🔢 Model: ${embeddingData.model}`)
    console.log(`📐 Dimension: ${embeddingData.dimension}`)
    console.log(`📊 Total embeddings: ${Object.keys(embeddingData.embeddings).length}`)
    
    // Verify embeddings
    const sampleIds = Object.keys(embeddingData.embeddings).slice(0, 3)
    console.log('\n🔍 Sample embeddings (first 5 dimensions):')
    for (const id of sampleIds) {
      const item = embeddingData.embeddings[id]
      const preview = item.embedding.slice(0, 5).map(v => v.toFixed(3)).join(', ')
      console.log(`  ${item.slug}: [${preview}, ...]`)
    }
    
  } catch (error) {
    console.error('Error generating embeddings:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run if called directly
generateEmbeddings()