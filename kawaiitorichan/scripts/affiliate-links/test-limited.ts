#!/usr/bin/env tsx
/**
 * Test script with limited data (100 products, all posts)
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import { spawn } from 'child_process'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`)
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'your-secret-key-here',
        DATABASE_URI: process.env.DATABASE_URI || 'postgres://postgres:2801@127.0.0.1:5432/golfer',
      },
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with code ${code}`))
      }
    })
  })
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🧪 Running limited test with 100 products and all posts')
    console.log('=' .repeat(50))
    
    // 1. Check current data
    const products = await payload.find({
      collection: 'affiliate-products',
      where: {
        status: {
          equals: 'active',
        },
      },
      limit: 100, // Limit to 100 products for testing
    })
    
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      limit: 1000,
    })
    
    console.log(`📦 Found ${products.docs.length} active products (limited to 100)`)
    console.log(`📝 Found ${posts.docs.length} published posts`)
    
    // 2. Create limited index
    console.log('\n📚 Building limited index...')
    const limitedProductIndex = products.docs.map(product => ({
      id: product.id,
      product_name: product.product_name,
      keyword_research: product.keyword_research,
      keywords: product.keywords?.map((k: any) => k.keyword) || [],
      description: product.description || '',
      language: product.language,
      anchorPhrases: extractAnchorPhrases(product),
      contentHash: product.metadata?.contentHash || '',
      affiliate_url: product.affiliate_url,
      clean_url: product.clean_url || product.affiliate_url,
      price: product.price || '',
      status: product.status,
    }))
    
    // Save limited index
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(
      path.join(DATA_DIR, 'products-index.json'),
      JSON.stringify(limitedProductIndex, null, 2)
    )
    
    // 3. Run the pipeline steps
    console.log('\n🚀 Running pipeline steps...')
    
    // Build post index
    await runCommand('tsx', ['scripts/affiliate-links/01-build-index.ts'])
    
    // Generate embeddings (this will be faster with fewer products)
    console.log('\n🧮 Generating embeddings (this may take a minute)...')
    await runCommand('tsx', ['scripts/affiliate-links/02-generate-embeddings.ts'])
    
    // Compute similarity
    console.log('\n🔍 Computing similarity...')
    await runCommand('tsx', ['scripts/affiliate-links/03-compute-similarity.ts'])
    
    // Apply links with dry run to 5 posts
    console.log('\n🔗 Applying links (dry run, 5 posts)...')
    await runCommand('tsx', ['scripts/affiliate-links/04-apply-links.ts', '--dry-run', '--limit', '5'])
    
    // Read and display results
    const similarityPath = path.join(DATA_DIR, 'similarity-matrix.json')
    if (await fs.access(similarityPath).then(() => true).catch(() => false)) {
      const similarity = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
      
      console.log('\n' + '='.repeat(50))
      console.log('📊 Test Results:')
      console.log('='.repeat(50))
      console.log(`✅ Posts with matching products: ${similarity.length}`)
      
      if (similarity.length > 0) {
        console.log('\n🏆 Top matches:')
        similarity.slice(0, 3).forEach((result: any) => {
          console.log(`\n📝 Post: ${result.postSlug}`)
          console.log(`   Products found: ${result.relevantProducts.length}`)
          result.relevantProducts.slice(0, 3).forEach((product: any) => {
            console.log(`   - ${product.productName} (score: ${product.score.toFixed(2)})`)
            if (product.matchedKeywords.length > 0) {
              console.log(`     Keywords: ${product.matchedKeywords.join(', ')}`)
            }
          })
        })
      }
    }
    
    console.log('\n' + '🎉'.repeat(25))
    console.log('✅ Test completed successfully!')
    console.log('🎉'.repeat(25))
    console.log('\nNext steps:')
    console.log('1. Review the matches above')
    console.log('2. Run without --dry-run to apply links')
    console.log('3. Check the admin panel at /admin/affiliate-links')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

function extractAnchorPhrases(product: any): string[] {
  const phrases = new Set<string>()
  
  if (product.keyword_research) {
    phrases.add(product.keyword_research)
  }
  
  if (product.keywords && Array.isArray(product.keywords)) {
    for (const kw of product.keywords) {
      if (kw.keyword) {
        phrases.add(kw.keyword)
      }
    }
  }
  
  return Array.from(phrases)
}

main().catch(console.error)