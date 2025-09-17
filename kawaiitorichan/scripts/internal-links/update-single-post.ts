#!/usr/bin/env tsx
/**
 * Update internal links for a single post
 * Useful for incremental updates when new posts are added
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Extract text from Lexical content
 */
function extractTextFromLexical(node: any): string {
  if (!node) return ''
  
  let text = ''
  
  if (node.type === 'text' && node.text) {
    text += node.text + ' '
  }
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      text += extractTextFromLexical(child)
    }
  }
  
  if (node.root) {
    text += extractTextFromLexical(node.root)
  }
  
  return text
}

/**
 * Call Python embedding service
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, 'embedding-service.py')
    const python = spawn('python3', [pythonScript, 'embed'])
    
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
        console.warn('Python embedding service not available, using fallback')
        resolve(null)
      } else {
        try {
          const result = JSON.parse(stdout)
          resolve(result.embedding || null)
        } catch {
          resolve(null)
        }
      }
    })
    
    python.on('error', () => {
      resolve(null)
    })
    
    python.stdin.write(text)
    python.stdin.end()
  })
}

/**
 * Simple fallback embedding
 */
function generateSimpleEmbedding(text: string, dimension: number = 384): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0)
  const embedding = new Array(dimension).fill(0)
  
  for (const word of words) {
    const hash = crypto.createHash('md5').update(word).digest()
    for (let i = 0; i < Math.min(hash.length, dimension); i++) {
      embedding[i] += hash[i] / 255.0 / words.length
    }
  }
  
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm
    }
  }
  
  return embedding
}

/**
 * Compute cosine similarity
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
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
  
  if (norm1 === 0 || norm2 === 0) return 0
  
  return dotProduct / (norm1 * norm2)
}

async function updateSinglePost(slug: string, options: { rebuild?: boolean } = {}) {
  const { rebuild = false } = options
  
  console.log(`Updating internal links for post: ${slug}`)
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Find the post
    const { docs: posts } = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })
    
    if (posts.length === 0) {
      console.error(`Post not found: ${slug}`)
      process.exit(1)
    }
    
    const post = posts[0]
    console.log(`Found post: ${post.title}`)
    
    // Extract text content
    const textContent = extractTextFromLexical(post.content)
    const excerptText = post.excerpt ? extractTextFromLexical(post.excerpt) : ''
    const embeddingText = `${post.title} ${excerptText} ${textContent.substring(0, 500)}`
    
    // Load existing data
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    const embeddingsPath = path.join(process.cwd(), 'data', 'internal-links', 'embeddings.json')
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    
    let indexData: any
    let embeddingsData: any
    let similarityData: any
    
    try {
      indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
      embeddingsData = JSON.parse(await fs.readFile(embeddingsPath, 'utf-8'))
      similarityData = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
    } catch (error) {
      console.error('Failed to load index files. Please run the full pipeline first.')
      process.exit(1)
    }
    
    if (rebuild) {
      console.log('Rebuilding index entry for this post...')
      
      // Generate embedding
      let embedding = await generateEmbedding(embeddingText)
      if (!embedding) {
        embedding = generateSimpleEmbedding(embeddingText)
      }
      
      // Update embeddings data
      embeddingsData.embeddings[post.id] = {
        slug: post.slug,
        embedding,
        textHash: crypto.createHash('md5').update(embeddingText).digest('hex'),
      }
      
      // Compute new similarities
      const similarities: any[] = []
      
      for (const [otherId, otherData] of Object.entries(embeddingsData.embeddings)) {
        if (otherId === post.id) continue
        
        const otherEmbedding = (otherData as any).embedding
        const similarity = cosineSimilarity(embedding, otherEmbedding)
        
        if (similarity >= 0.3) {
          similarities.push({
            id: otherId,
            slug: (otherData as any).slug,
            score: similarity,
            categoryOverlap: 0,
            tagOverlap: 0,
          })
        }
      }
      
      // Sort and keep top 20
      similarities.sort((a, b) => b.score - a.score)
      similarityData.similarities[post.id] = {
        slug: post.slug,
        similar: similarities.slice(0, 20),
      }
      
      // Save updated data
      await fs.writeFile(embeddingsPath, JSON.stringify(embeddingsData, null, 2))
      await fs.writeFile(similarityPath, JSON.stringify(similarityData, null, 2))
      
      console.log('✅ Index updated for this post')
    }
    
    // Now apply backlinks using the existing apply script
    console.log('\nApplying backlinks...')
    
    const applyScript = path.join(__dirname, '04-apply-backlinks.ts')
    const child = spawn('tsx', [applyScript, `--limit=1`], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        SINGLE_POST_ID: post.id,
      },
    })
    
    await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', (code) => {
        if (code === 0) {
          resolve(null)
        } else {
          reject(new Error(`Apply script failed with code ${code}`))
        }
      })
    })
    
    console.log('\n✅ Post updated successfully!')
    
  } catch (error) {
    console.error('Error updating post:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Main execution
const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help')) {
  console.log(`
Update Internal Links for Single Post

Usage: tsx update-single-post.ts <slug> [options]

Options:
  --rebuild      Rebuild index entry for this post
  --help         Show this help message

Examples:
  # Update links for a post using existing index
  tsx update-single-post.ts my-post-slug
  
  # Rebuild index and update links
  tsx update-single-post.ts my-post-slug --rebuild
`)
  process.exit(0)
}

const slug = args[0]
const rebuild = args.includes('--rebuild')

updateSinglePost(slug, { rebuild })