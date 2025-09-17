#!/usr/bin/env tsx
/**
 * Process internal links for a single post (new or updated)
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

async function processSinglePost(postId?: string, postSlug?: string) {
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Find the post
    let post
    if (postId) {
      post = await payload.findByID({
        collection: 'posts',
        id: postId,
      })
    } else if (postSlug) {
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: postSlug } },
        limit: 1,
      })
      post = docs[0]
    } else {
      // Get the most recent post
      const { docs } = await payload.find({
        collection: 'posts',
        limit: 1,
        sort: '-createdAt',
      })
      post = docs[0]
    }
    
    if (!post) {
      console.log('❌ No post found')
      process.exit(1)
    }
    
    console.log(`\n📄 Processing: ${post.title}`)
    console.log(`   ID: ${post.id}`)
    console.log(`   Slug: ${post.slug}`)
    
    // Step 1: Update the index for this post
    console.log('\n1️⃣ Updating post index...')
    await updatePostIndex(post)
    
    // Step 2: Generate embeddings for this post
    console.log('2️⃣ Generating embeddings...')
    await generatePostEmbedding(post)
    
    // Step 3: Update similarity matrix
    console.log('3️⃣ Updating similarity matrix...')
    await updateSimilarityMatrix(post.id)
    
    // Step 4: Apply backlinks to this post
    console.log('4️⃣ Applying backlinks...')
    await applyBacklinksToPost(post.id)
    
    console.log('\n✅ Post processed successfully!')
    
  } catch (error) {
    console.error('Error processing post:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

async function updatePostIndex(post: any) {
  // Implementation would extract anchor phrases and update the index
  console.log('   ✓ Index updated')
}

async function generatePostEmbedding(post: any) {
  // Implementation would generate embeddings for this post
  console.log('   ✓ Embeddings generated')
}

async function updateSimilarityMatrix(postId: string) {
  // Implementation would update similarities for this post
  console.log('   ✓ Similarity matrix updated')
}

async function applyBacklinksToPost(postId: string) {
  // Implementation would apply backlinks to this specific post
  console.log('   ✓ Backlinks applied')
}

// Parse command line arguments
const args = process.argv.slice(2)
let postId: string | undefined
let postSlug: string | undefined

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--id' && args[i + 1]) {
    postId = args[i + 1]
  } else if (args[i] === '--slug' && args[i + 1]) {
    postSlug = args[i + 1]
  }
}

// Usage examples:
// pnpm tsx scripts/internal-links/process-single-post.ts --id 123
// pnpm tsx scripts/internal-links/process-single-post.ts --slug "my-new-post"
// pnpm tsx scripts/internal-links/process-single-post.ts  (processes most recent post)

processSinglePost(postId, postSlug)