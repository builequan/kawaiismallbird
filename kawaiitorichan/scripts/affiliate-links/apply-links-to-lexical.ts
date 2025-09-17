#!/usr/bin/env tsx
/**
 * Apply affiliate links directly to Lexical content
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface SimilarityResult {
  postId: string
  postSlug: string
  relevantProducts: Array<{
    productId: string
    productName: string
    score: number
    matchType: string
    matchedKeywords: string[]
  }>
}

interface ProductIndex {
  id: string
  product_name: string
  affiliate_url: string
  clean_url: string
  price: string
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Create affiliate link nodes for Lexical
 */
function createAffiliateLexicalNodes(products: ProductIndex[]) {
  const nodes = []
  
  // Add heading
  nodes.push({
    type: 'heading',
    version: 1,
    tag: 'h3',
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [
      {
        type: 'text',
        version: 1,
        text: 'おすすめ商品',
        format: 0,
        detail: 0,
        mode: 'normal',
        style: ''
      }
    ]
  })
  
  // Add each product
  for (const product of products) {
    const url = extractAffiliateUrl(product.affiliate_url)
    
    // Product name paragraph
    nodes.push({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: [
        {
          type: 'text',
          version: 1,
          text: product.product_name,
          format: 1, // Bold
          detail: 0,
          mode: 'normal',
          style: ''
        }
      ]
    })
    
    // Price paragraph
    nodes.push({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: [
        {
          type: 'text',
          version: 1,
          text: '価格: ' + product.price,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: ''
        }
      ]
    })
    
    // Link paragraph
    nodes.push({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: [
        {
          type: 'link',
          version: 2,
          format: '',
          indent: 0,
          direction: 'ltr',
          fields: {
            linkType: 'custom',
            url: url,
            newTab: true,
            rel: 'nofollow sponsored'
          },
          children: [
            {
              type: 'text',
              version: 1,
              text: '詳細を見る →',
              format: 0,
              detail: 0,
              mode: 'normal',
              style: ''
            }
          ]
        }
      ]
    })
    
    // Add spacing
    nodes.push({
      type: 'paragraph',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: []
    })
  }
  
  return nodes
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🔗 Applying affiliate links to Lexical content...')
    
    // Load data
    const similarityPath = path.join(DATA_DIR, 'similarity-matrix.json')
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    
    const similarities: SimilarityResult[] = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    
    // Create product lookup
    const productMap = new Map<string, ProductIndex>()
    for (const product of products) {
      productMap.set(product.id, product)
    }
    
    // Process options
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : 5
    
    const postsToProcess = similarities.slice(0, limit)
    console.log(`📝 Processing ${postsToProcess.length} posts`)
    
    let processed = 0
    let skipped = 0
    let errors = 0
    
    for (const similarity of postsToProcess) {
      try {
        // Fetch the post
        const post = await payload.findByID({
          collection: 'posts',
          id: similarity.postId,
        })
        
        if (!post) {
          console.log(`⚠️  Post not found: ${similarity.postId}`)
          skipped++
          continue
        }
        
        // Check if already has affiliate links
        const contentStr = JSON.stringify(post.content)
        if (contentStr.includes('おすすめ商品')) {
          console.log(`⏭️  Already has affiliate links: ${post.title}`)
          skipped++
          continue
        }
        
        // Get products for recommendations
        const recommendProducts = similarity.relevantProducts
          .slice(0, 2) // Max 2 products
          .map(rp => productMap.get(rp.productId))
          .filter(p => p) as ProductIndex[]
        
        if (recommendProducts.length === 0) {
          console.log(`⚠️  No valid products for: ${post.title}`)
          skipped++
          continue
        }
        
        // Create new Lexical nodes
        const affiliateNodes = createAffiliateLexicalNodes(recommendProducts)
        
        // Add to existing content
        const updatedContent = {
          ...post.content,
          root: {
            ...post.content.root,
            children: [
              ...post.content.root.children,
              ...affiliateNodes
            ]
          }
        }
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
          },
        })
        
        console.log(`✅ Added ${recommendProducts.length} affiliate links to: ${post.title}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Error processing post ${similarity.postId}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Affiliate links added to Lexical content!')
    console.log('='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main().catch(console.error)