#!/usr/bin/env tsx
/**
 * Apply affiliate links to posts
 * Both inline replacements and recommendation sections
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

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
  keyword_research: string
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
}

interface LinkApplication {
  targetId: string
  productName: string
  anchorText: string
  position: string
  type: 'inline' | 'recommendation'
}

/**
 * Extract clean affiliate URL from HTML
 */
function extractAffiliateUrl(html: string): string {
  // Try to extract href from HTML
  const match = html.match(/href="([^"]+)"/i)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Create an affiliate link node for Lexical
 */
function createAffiliateLinkNode(url: string, anchorText: string): any {
  return {
    type: 'link',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: anchorText,
        version: 1,
      }
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 2,
    fields: {
      linkType: 'custom',
      url: url,
      newTab: true,
      rel: 'nofollow sponsored',
    }
  }
}

/**
 * Create a product recommendation block
 */
function createRecommendationBlock(products: Array<{ product: ProductIndex; score: number }>): any {
  const recommendationNodes = []
  
  // Add heading
  recommendationNodes.push({
    type: 'heading',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: 'おすすめ商品',
        version: 1,
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    tag: 'h3',
    version: 1,
  })
  
  // Add products
  for (const { product } of products) {
    // Product container
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 1, // Bold
          mode: 'normal',
          style: '',
          text: product.product_name,
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: ' - ',
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: product.price,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    // Add affiliate link button
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        createAffiliateLinkNode(
          extractAffiliateUrl(product.affiliate_url),
          '詳細を見る →'
        )
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
  }
  
  return recommendationNodes
}

/**
 * Apply inline affiliate links to content
 */
function applyInlineLinks(
  content: any,
  products: Array<{ product: ProductIndex; matchedKeywords: string[] }>,
  maxLinks: number = 3
): { content: any; linksAdded: LinkApplication[] } {
  const linksAdded: LinkApplication[] = []
  const usedKeywords = new Set<string>() // Track used keywords to avoid duplicates
  let linkCount = 0
  
  if (!content || !content.root || !content.root.children) {
    return { content, linksAdded }
  }
  
  // Process each node
  function processNode(node: any, path: string = ''): any {
    if (linkCount >= maxLinks) return node
    
    // Skip headings
    if (node.type === 'heading') return node
    
    // Skip existing links
    if (node.type === 'link') return node
    
    // Process text nodes
    if (node.type === 'text' && node.text) {
      let text = node.text
      let modified = false
      
      // Try to match keywords
      for (const { product, matchedKeywords } of products) {
        if (linkCount >= maxLinks) break
        
        for (const keyword of matchedKeywords) {
          if (linkCount >= maxLinks) break
          
          // Skip if this keyword was already used
          const keywordLower = keyword.toLowerCase()
          if (usedKeywords.has(keywordLower)) continue
          
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
          const match = text.match(regex)
          
          if (match) {
            // Replace first occurrence
            const url = extractAffiliateUrl(product.affiliate_url)
            const beforeText = text.substring(0, text.indexOf(match[0]))
            const afterText = text.substring(text.indexOf(match[0]) + match[0].length)
            
            // Create new nodes
            const newNodes = []
            
            if (beforeText) {
              newNodes.push({
                ...node,
                text: beforeText,
              })
            }
            
            newNodes.push(createAffiliateLinkNode(url, match[0]))
            
            if (afterText) {
              newNodes.push({
                ...node,
                text: afterText,
              })
            }
            
            linksAdded.push({
              targetId: product.id,
              productName: product.product_name,
              anchorText: match[0],
              position: path,
              type: 'inline',
            })
            
            // Mark this keyword as used
            usedKeywords.add(keywordLower)
            linkCount++
            modified = true
            
            return newNodes // Return array of nodes
          }
        }
      }
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      const newChildren = []
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        const result = processNode(child, `${path}/children[${i}]`)
        
        if (Array.isArray(result)) {
          newChildren.push(...result)
        } else {
          newChildren.push(result)
        }
      }
      
      return {
        ...node,
        children: newChildren,
      }
    }
    
    return node
  }
  
  // Process the content
  const newRoot = processNode(content.root, 'root')
  
  return {
    content: {
      ...content,
      root: newRoot,
    },
    linksAdded,
  }
}

/**
 * Create content hash
 */
function createContentHash(content: any): string {
  const text = JSON.stringify(content)
  return crypto.createHash('md5').update(text).digest('hex')
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🔗 Applying affiliate links to posts...')
    
    // Load data
    const similarityPath = path.join(DATA_DIR, 'similarity-matrix.json')
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    
    if (!await fs.access(similarityPath).then(() => true).catch(() => false)) {
      console.error('❌ Similarity matrix not found. Run 03-compute-similarity.ts first.')
      process.exit(1)
    }
    
    const similarities: SimilarityResult[] = JSON.parse(await fs.readFile(similarityPath, 'utf-8'))
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    
    // Create product lookup
    const productMap = new Map<string, ProductIndex>()
    for (const product of products) {
      productMap.set(product.id, product)
    }
    
    // Process options
    const dryRun = process.argv.includes('--dry-run')
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : undefined
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be saved')
    }
    
    const postsToProcess = limit ? similarities.slice(0, limit) : similarities
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
        
        // Check if already processed with same content
        const currentHash = createContentHash(post.content)
        if (post.affiliateLinksMetadata?.contentHash === currentHash) {
          console.log(`⏭️  Skipping unchanged: ${post.title}`)
          skipped++
          continue
        }
        
        // Prepare products for this post
        const relevantProducts = similarity.relevantProducts
          .slice(0, 5) // Max 5 products total
          .map(rp => ({
            product: productMap.get(rp.productId)!,
            score: rp.score,
            matchedKeywords: rp.matchedKeywords,
          }))
          .filter(p => p.product) // Ensure product exists
        
        if (relevantProducts.length === 0) {
          console.log(`⚠️  No valid products for: ${post.title}`)
          skipped++
          continue
        }
        
        // Apply inline links (max 3, but ensure unique keywords)
        const inlineProducts = relevantProducts
          .filter(p => p.matchedKeywords.length > 0)
          .slice(0, 5) // Get more candidates to ensure diversity
        
        let updatedContent = post.content
        let linksAdded: LinkApplication[] = []
        
        if (inlineProducts.length > 0) {
          const result = applyInlineLinks(updatedContent, inlineProducts, 3)
          updatedContent = result.content
          linksAdded = result.linksAdded
        }
        
        // Calculate remaining link budget (max 5 total)
        const remainingBudget = Math.max(0, 5 - linksAdded.length)
        
        // Add recommendation section with remaining budget
        const recommendationProducts = relevantProducts
          .filter(p => !linksAdded.some(l => l.targetId === p.product.id)) // Avoid duplicates
          .slice(0, Math.min(2, remainingBudget))
        const recommendationBlock = createRecommendationBlock(recommendationProducts)
        
        // Add recommendation block to content
        if (updatedContent?.root?.children) {
          updatedContent.root.children.push(...recommendationBlock)
          
          // Track recommendation links
          for (const { product } of recommendationProducts) {
            linksAdded.push({
              targetId: product.id,
              productName: product.product_name,
              anchorText: '詳細を見る',
              position: 'recommendation-section',
              type: 'recommendation',
            })
          }
        }
        
        console.log(`✅ Adding ${linksAdded.length} affiliate links for: ${post.title} (max 5)`)
        console.log(`   - Inline links: ${linksAdded.filter(l => l.type === 'inline').length} (unique keywords)`)
        console.log(`   - Recommendations: ${linksAdded.filter(l => l.type === 'recommendation').length}`)
        
        if (!dryRun) {
          // Update the post
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: updatedContent,
              affiliateLinksMetadata: {
                version: '1.0.0',
                lastProcessed: new Date().toISOString(),
                linksAdded: linksAdded.map(link => ({
                  productId: link.targetId,
                  productName: link.productName,
                  anchorText: link.anchorText,
                  position: link.position,
                  type: link.type,
                })),
                contentHash: createContentHash(updatedContent),
              },
            },
          })
          
          // Update product usage count
          for (const link of linksAdded) {
            const product = await payload.findByID({
              collection: 'affiliate-products',
              id: link.targetId,
            })
            
            if (product) {
              await payload.update({
                collection: 'affiliate-products',
                id: link.targetId,
                data: {
                  performance: {
                    ...product.performance,
                    usageCount: (product.performance?.usageCount || 0) + 1,
                  },
                },
              })
            }
          }
        }
        
        processed++
      } catch (error) {
        console.error(`❌ Error processing post ${similarity.postId}:`, error)
        errors++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Affiliate link application complete!')
    console.log('='.repeat(50))
    console.log(`📊 Results:`)
    console.log(`   ✅ Processed: ${processed}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    if (dryRun) {
      console.log(`\n🔍 DRY RUN - No changes were saved`)
    }
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error applying affiliate links:', error)
    process.exit(1)
  }
}

main().catch(console.error)