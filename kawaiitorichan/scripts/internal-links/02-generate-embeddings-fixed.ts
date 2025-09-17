#!/usr/bin/env tsx
/**
 * Generate embeddings for posts (fixed version)
 */

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface PostIndex {
  id: string
  title: string
  slug: string
  excerpt?: string
  keywords: string[]
  anchorPhrases: string[]
  contentHash: string
  language: 'ja' | 'en'
  textContent: string
}

interface IndexData {
  posts: PostIndex[]
  timestamp: string
}

interface EmbeddingResult {
  embeddings: number[][]
}

/**
 * Start the Python embedding service
 */
async function startEmbeddingService(): Promise<{ pid: number; port: number }> {
  console.log('Starting Python embedding service...')
  
  try {
    // Start the service in the background
    const { stdout } = await execAsync(
      'python3 scripts/internal-links/embedding-service.py &',
      { cwd: process.cwd() }
    )
    
    // Give the service time to start
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return { pid: 0, port: 5001 }
  } catch (error) {
    console.error('Failed to start embedding service:', error)
    throw error
  }
}

/**
 * Generate embeddings using the Python service
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const port = 5001
  const maxRetries = 3
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: EmbeddingResult = await response.json()
      return result.embeddings
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      
      if (error.cause?.code === 'ECONNREFUSED') {
        console.log('Service not ready, starting it...')
        await startEmbeddingService()
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        throw error
      }
    }
  }
  
  throw new Error('Failed to get embeddings after retries')
}

/**
 * Prepare text for embedding
 */
function prepareTextForEmbedding(post: PostIndex): string {
  const parts = [
    post.title,
    post.excerpt || '',
    // Use the most important anchor phrases
    post.anchorPhrases.slice(0, 20).join(' '),
    // Include some keywords
    post.keywords.slice(0, 10).join(' '),
    // Include a snippet of the actual content
    post.textContent.substring(0, 500)
  ]
  
  return parts.filter(Boolean).join(' ')
}

async function generateEmbeddings() {
  console.log('Generating embeddings for posts (fixed version)...')
  
  try {
    // Load post index
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const indexContent = await fs.readFile(indexPath, 'utf-8')
    const indexData: IndexData = JSON.parse(indexContent)
    
    console.log(`Loading ${indexData.posts.length} posts from index...`)
    
    // Only process Japanese posts with content
    const postsToEmbed = indexData.posts.filter(post => 
      post.language === 'ja' && 
      (post.textContent.length > 100 || post.title.length > 0)
    )
    
    console.log(`Processing ${postsToEmbed.length} Japanese posts...`)
    
    // Prepare texts for embedding
    const texts = postsToEmbed.map(post => prepareTextForEmbedding(post))
    
    // Generate embeddings
    console.log('✓ Using Python embedding service: all-MiniLM-L6-v2')
    const embeddings = await getEmbeddings(texts)
    
    // Create embeddings data structure
    const embeddingsData: { [key: string]: number[] } = {}
    postsToEmbed.forEach((post, index) => {
      embeddingsData[post.id] = embeddings[index]
    })
    
    // Save embeddings
    const outputPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    await fs.writeFile(
      outputPath,
      JSON.stringify({
        model: 'all-MiniLM-L6-v2',
        dimension: 384,
        embeddings: embeddingsData,
        timestamp: new Date().toISOString()
      }, null, 2)
    )
    
    console.log(`\n✅ Embeddings generated successfully!`)
    console.log(`📁 Saved to: ${outputPath}`)
    console.log(`📊 Total embeddings: ${Object.keys(embeddingsData).length}`)
    
  } catch (error) {
    console.error('Error generating embeddings:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

generateEmbeddings().catch(console.error)