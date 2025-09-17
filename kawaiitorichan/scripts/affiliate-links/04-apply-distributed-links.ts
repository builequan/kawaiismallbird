#!/usr/bin/env tsx
/**
 * Apply affiliate links DISTRIBUTED throughout the ENTIRE article
 * Maximum 5 links spread evenly across the content
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_INLINE_LINKS = 5
const MAX_PRODUCTS_BOX = 3

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

/**
 * Count total paragraphs in content
 */
function countParagraphs(node: any): number {
  let count = 0
  
  function traverse(n: any) {
    if (!n) return
    if (n.type === 'paragraph') count++
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(traverse)
    }
  }
  
  traverse(node)
  return count
}

/**
 * Find all possible keyword matches throughout the article
 */
function findAllKeywordPositions(content: any, products: Array<{ product: ProductIndex; score: number }>): Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number }[]> {
  const positionMap = new Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number }[]>()
  let paragraphIndex = 0
  
  function traverse(node: any) {
    if (!node) return
    
    if (node.type === 'paragraph') {
      const textContent = extractText(node).toLowerCase()
      const matches: { product: ProductIndex; keyword: string; paragraphIndex: number }[] = []
      
      // Check each product's keywords
      for (const { product } of products) {
        for (const keyword of product.anchorPhrases || []) {
          if (textContent.includes(keyword.toLowerCase())) {
            matches.push({ product, keyword, paragraphIndex })
          }
        }
      }
      
      if (matches.length > 0) {
        positionMap.set(paragraphIndex, matches)
      }
      paragraphIndex++
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }
  
  function extractText(node: any): string {
    if (!node) return ''
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join(' ')
    }
    return ''
  }
  
  traverse(content.root)
  return positionMap
}

/**
 * Create an affiliate link node
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
 * Apply links distributed throughout the article
 */
function applyDistributedLinks(content: any, products: Array<{ product: ProductIndex; score: number }>): { content: any; linksAdded: number } {
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Find all possible positions
  const keywordPositions = findAllKeywordPositions(newContent, products)
  const totalParagraphs = countParagraphs(newContent)
  
  if (keywordPositions.size === 0) {
    return { content: newContent, linksAdded: 0 }
  }
  
  // Calculate distribution intervals
  const interval = Math.floor(totalParagraphs / (MAX_INLINE_LINKS + 1))
  const targetPositions: number[] = []
  
  // Create target positions evenly distributed
  for (let i = 1; i <= MAX_INLINE_LINKS; i++) {
    targetPositions.push(interval * i)
  }
  
  // Find actual positions closest to targets
  const selectedPositions: { paragraphIndex: number; product: ProductIndex; keyword: string }[] = []
  const usedKeywords = new Set<string>()
  
  for (const targetPos of targetPositions) {
    let bestMatch: { paragraphIndex: number; product: ProductIndex; keyword: string } | null = null
    let bestDistance = Infinity
    
    // Find closest paragraph with available keywords
    for (const [paragraphIndex, matches] of keywordPositions) {
      const distance = Math.abs(paragraphIndex - targetPos)
      
      if (distance < bestDistance) {
        // Find unused keyword in this paragraph
        for (const match of matches) {
          const keywordKey = match.keyword.toLowerCase()
          if (!usedKeywords.has(keywordKey)) {
            bestMatch = {
              paragraphIndex,
              product: match.product,
              keyword: match.keyword
            }
            bestDistance = distance
            break
          }
        }
      }
    }
    
    if (bestMatch) {
      selectedPositions.push(bestMatch)
      usedKeywords.add(bestMatch.keyword.toLowerCase())
    }
  }
  
  // Apply the selected links
  let linksAdded = 0
  let currentParagraph = 0
  
  function applyLinksToNode(node: any): any {
    if (!node) return node
    
    if (node.type === 'paragraph') {
      const positionToApply = selectedPositions.find(p => p.paragraphIndex === currentParagraph)
      currentParagraph++
      
      if (positionToApply) {
        // Apply link to this paragraph
        const applied = applyLinkToParagraph(node, positionToApply.keyword, positionToApply.product)
        if (applied.modified) {
          linksAdded++
          return applied.node
        }
      }
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(applyLinksToNode)
    }
    
    return node
  }
  
  function applyLinkToParagraph(paragraph: any, keyword: string, product: ProductIndex): { node: any; modified: boolean } {
    let modified = false
    
    function processNode(node: any): any {
      if (modified) return node // Only apply once per paragraph
      
      if (node.type === 'link') return node // Skip existing links
      
      if (node.text && typeof node.text === 'string') {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const match = regex.exec(node.text)
        
        if (match) {
          const beforeText = node.text.substring(0, match.index)
          const matchedText = match[0]
          const afterText = node.text.substring(match.index + matchedText.length)
          
          const nodes = []
          if (beforeText) {
            nodes.push({ type: 'text', text: beforeText, version: 1 })
          }
          nodes.push(createAffiliateLinkNode(product.affiliate_url, matchedText))
          if (afterText) {
            nodes.push({ type: 'text', text: afterText, version: 1 })
          }
          
          modified = true
          return nodes
        }
      }
      
      if (node.children && Array.isArray(node.children)) {
        const newChildren = []
        for (const child of node.children) {
          const processed = processNode(child)
          if (Array.isArray(processed)) {
            newChildren.push(...processed)
          } else {
            newChildren.push(processed)
          }
        }
        node.children = newChildren
      }
      
      return node
    }
    
    const newParagraph = JSON.parse(JSON.stringify(paragraph))
    processNode(newParagraph)
    
    return { node: newParagraph, modified }
  }
  
  newContent.root = applyLinksToNode(newContent.root)
  
  return { content: newContent, linksAdded }
}

/**
 * Create product recommendation box
 */
function createRecommendationBox(products: Array<{ product: ProductIndex; score: number }>): any {
  const recommendationNodes = []
  const limitedProducts = products.slice(0, MAX_PRODUCTS_BOX)
  
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
  
  recommendationNodes.push({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: '記事内でご紹介した商品',
        version: 1,
      }
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  })
  
  limitedProducts.forEach((item, index) => {
    const { product } = item
    
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: '',
          version: 1,
        }
      ],
      version: 1,
    })
    
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 1,
          mode: 'normal',
          style: '',
          text: `人気 #${index + 1}`,
          version: 1,
        },
        {
          type: 'text',
          text: '  ',
          version: 1,
        },
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: product.product_name,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: `価格: ${product.price}`,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
    
    recommendationNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '詳細を見る →',
              version: 1,
            }
          ],
          direction: null,
          format: '',
          indent: 0,
          version: 2,
          fields: {
            linkType: 'custom',
            url: product.affiliate_url,
            newTab: true,
            rel: 'nofollow sponsored',
          }
        }
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
  })
  
  return recommendationNodes
}

/**
 * Process a single post
 */
async function processPost(
  payload: any,
  postId: string,
  products: Array<{ product: ProductIndex; score: number }>,
  dryRun: boolean = false
): Promise<{ linksAdded: number; productsAdded: number }> {
  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })
    
    if (!post || !post.content?.root) {
      console.log(`   ⚠️  Post ${postId} has no content`)
      return { linksAdded: 0, productsAdded: 0 }
    }
    
    // Apply distributed inline links
    const { content: contentWithLinks, linksAdded } = applyDistributedLinks(post.content, products)
    
    // Add recommendation box at the end
    if (!contentWithLinks.root.children) {
      contentWithLinks.root.children = []
    }
    
    // Remove existing recommendation section if any
    let recommendationIndex = -1
    for (let i = 0; i < contentWithLinks.root.children.length; i++) {
      const child = contentWithLinks.root.children[i]
      if (child.type === 'heading' && child.children?.[0]?.text === 'おすすめ商品') {
        recommendationIndex = i
        break
      }
    }
    
    if (recommendationIndex >= 0) {
      if (recommendationIndex > 0 && 
          contentWithLinks.root.children[recommendationIndex - 1].type === 'horizontalrule') {
        recommendationIndex--
      }
      contentWithLinks.root.children = contentWithLinks.root.children.slice(0, recommendationIndex)
    }
    
    // Add new recommendation box
    const productsForBox = products.slice(0, MAX_PRODUCTS_BOX)
    if (productsForBox.length > 0) {
      contentWithLinks.root.children.push({
        type: 'horizontalrule',
        version: 1,
      })
      
      const recommendationNodes = createRecommendationBox(productsForBox)
      contentWithLinks.root.children.push(...recommendationNodes)
    }
    
    // Update post if not dry run
    if (!dryRun && (linksAdded > 0 || productsForBox.length > 0)) {
      await payload.update({
        collection: 'posts',
        id: postId,
        data: {
          content: contentWithLinks,
        },
      })
    }
    
    console.log(`   ✅ Added ${linksAdded} inline links (distributed across article)`)
    console.log(`   📦 Added ${productsForBox.length} products in recommendation box`)
    
    return { linksAdded, productsAdded: productsForBox.length }
  } catch (error) {
    console.error(`   ❌ Error processing post ${postId}:`, error)
    return { linksAdded: 0, productsAdded: 0 }
  }
}

/**
 * Main function
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  const limitArg = process.argv.find(arg => arg.startsWith('--limit'))
  const limit = limitArg ? parseInt(limitArg.split('=')[1] || limitArg.split(' ')[1] || '0') : 0
  
  console.log('🎯 Applying Distributed Affiliate Links')
  console.log('=' .repeat(60))
  console.log(`📍 Inline links: Maximum ${MAX_INLINE_LINKS} distributed throughout article`)
  console.log(`📦 Product box: Maximum ${MAX_PRODUCTS_BOX} products at end`)
  console.log(`🔄 Links will be evenly spread across the entire content`)
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be saved')
  }
  
  if (limit > 0) {
    console.log(`📊 Processing limit: ${limit} posts`)
  }
  
  console.log('')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Load similarity results
    const similarityPath = path.join(DATA_DIR, 'similarity-results.json')
    const similarityData = await fs.readFile(similarityPath, 'utf-8')
    const similarities: SimilarityResult[] = JSON.parse(similarityData)
    
    // Load product index
    const indexPath = path.join(DATA_DIR, 'product-index.json')
    const indexData = await fs.readFile(indexPath, 'utf-8')
    const productIndex: ProductIndex[] = JSON.parse(indexData)
    
    // Create product lookup
    const productLookup = new Map<string, ProductIndex>()
    for (const product of productIndex) {
      productLookup.set(product.id, product)
    }
    
    // Process posts
    let processed = 0
    let skipped = 0
    let totalLinksAdded = 0
    let totalProductsAdded = 0
    
    const postsToProcess = limit > 0 ? similarities.slice(0, limit) : similarities
    
    for (const similarity of postsToProcess) {
      if (similarity.relevantProducts.length === 0) {
        console.log(`📝 ${similarity.postSlug}: No matching products`)
        skipped++
        continue
      }
      
      console.log(`📝 Processing: ${similarity.postSlug}`)
      
      // Get full product data
      const productsWithScores = similarity.relevantProducts
        .map(rp => ({
          product: productLookup.get(rp.productId)!,
          score: rp.score,
        }))
        .filter(p => p.product)
      
      const result = await processPost(
        payload,
        similarity.postId,
        productsWithScores,
        isDryRun
      )
      
      if (result.linksAdded > 0 || result.productsAdded > 0) {
        totalLinksAdded += result.linksAdded
        totalProductsAdded += result.productsAdded
        processed++
      } else {
        skipped++
      }
      
      console.log('')
    }
    
    // Summary
    console.log('=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Processed: ${processed} posts`)
    console.log(`   Skipped: ${skipped} posts`)
    console.log(`   Total inline links added: ${totalLinksAdded}`)
    console.log(`   Total products in boxes: ${totalProductsAdded}`)
    console.log(`   Distribution: Links spread evenly throughout articles`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { processPost, MAX_INLINE_LINKS, MAX_PRODUCTS_BOX }