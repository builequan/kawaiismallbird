#!/usr/bin/env tsx
/**
 * Apply CONTEXTUALLY RELEVANT affiliate links
 * Only link text that directly relates to the product
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
 * Extract specific product type from product name
 */
function getProductType(productName: string): string[] {
  const name = productName.toLowerCase()
  const types: string[] = []
  
  // Golf club types
  if (name.includes('ドライバー') || name.includes('driver')) types.push('ドライバー')
  if (name.includes('アイアン') || name.includes('iron')) types.push('アイアン')
  if (name.includes('パター') || name.includes('putter')) types.push('パター')
  if (name.includes('ウェッジ') || name.includes('wedge')) types.push('ウェッジ')
  if (name.includes('フェアウェイウッド') || name.includes('fairway')) types.push('フェアウェイウッド')
  if (name.includes('ユーティリティ') || name.includes('utility') || name.includes('hybrid')) types.push('ユーティリティ')
  
  // Golf gear
  if (name.includes('ボール') || name.includes('ball')) types.push('ボール', 'ゴルフボール')
  if (name.includes('グローブ') || name.includes('glove')) types.push('グローブ', 'ゴルフグローブ')
  if (name.includes('ティー') || name.includes('tee')) types.push('ティー', 'ゴルフティー')
  if (name.includes('マーカー') || name.includes('marker')) types.push('マーカー', 'ボールマーカー')
  
  // Training aids
  if (name.includes('スイング') && name.includes('練習')) types.push('スイング練習器具', '練習器具')
  if (name.includes('パット') && name.includes('練習')) types.push('パター練習器具', 'パット練習')
  if (name.includes('ネット') || name.includes('net')) types.push('練習ネット', 'ゴルフネット')
  if (name.includes('マット') || name.includes('mat')) types.push('練習マット', 'ゴルフマット')
  if (name.includes('ミラー') || name.includes('mirror')) types.push('スイングミラー', 'ミラー')
  
  // Accessories
  if (name.includes('バッグ') || name.includes('bag')) types.push('ゴルフバッグ', 'キャディバッグ')
  if (name.includes('シューズ') || name.includes('shoe')) types.push('ゴルフシューズ', 'シューズ')
  if (name.includes('ウェア') || name.includes('wear')) types.push('ゴルフウェア', 'ウェア')
  if (name.includes('レインウェア') || name.includes('rain')) types.push('レインウェア', '雨具')
  
  // Technology
  if (name.includes('gps') || name.includes('距離計')) types.push('GPS', '距離計', 'ゴルフGPS')
  if (name.includes('レーザー') || name.includes('laser')) types.push('レーザー距離計', '距離計')
  if (name.includes('スコア') && name.includes('カード')) types.push('スコアカード')
  
  // Specific brands or models should match exact mentions
  if (name.includes('tour ad')) types.push('tour ad', 'ツアーAD')
  if (name.includes('callaway')) types.push('callaway', 'キャロウェイ')
  if (name.includes('titleist')) types.push('titleist', 'タイトリスト')
  if (name.includes('ping')) types.push('ping', 'ピン')
  if (name.includes('taylormade')) types.push('taylormade', 'テーラーメイド')
  
  return types
}

/**
 * Check if text contextually matches product
 */
function isContextualMatch(text: string, product: ProductIndex): boolean {
  const productTypes = getProductType(product.product_name)
  const textLower = text.toLowerCase()
  
  // Check if any product type matches the text
  for (const type of productTypes) {
    if (textLower.includes(type.toLowerCase())) {
      return true
    }
  }
  
  // Check if text is too generic (avoid linking generic terms)
  const genericTerms = ['ゴルフ', 'golf', 'プレー', 'play', 'スポーツ', 'sport', 'ラウンド', 'round']
  const isGeneric = genericTerms.some(term => textLower === term.toLowerCase())
  
  if (isGeneric && productTypes.length === 0) {
    return false // Don't link generic terms to non-specific products
  }
  
  return false
}

/**
 * Find contextually relevant keyword positions
 */
function findContextualMatches(content: any, products: Array<{ product: ProductIndex; score: number }>): Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number }[]> {
  const positionMap = new Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number }[]>()
  let paragraphIndex = 0
  
  function traverse(node: any) {
    if (!node) return
    
    if (node.type === 'paragraph') {
      const textContent = extractText(node)
      const matches: { product: ProductIndex; keyword: string; paragraphIndex: number }[] = []
      
      // Check each product
      for (const { product } of products) {
        const productTypes = getProductType(product.product_name)
        
        // Look for contextual matches
        for (const type of productTypes) {
          // Use word boundaries for exact matches
          const regex = new RegExp(`\\b${type}\\b`, 'gi')
          if (regex.test(textContent)) {
            matches.push({ product, keyword: type, paragraphIndex })
            break // Only one match per product per paragraph
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
 * Apply contextually relevant links distributed throughout article
 */
function applyContextualLinks(content: any, products: Array<{ product: ProductIndex; score: number }>): { content: any; linksAdded: number; appliedProducts: ProductIndex[] } {
  const newContent = JSON.parse(JSON.stringify(content))
  const appliedProducts: ProductIndex[] = []
  
  // Find contextual matches
  const contextualMatches = findContextualMatches(newContent, products)
  
  if (contextualMatches.size === 0) {
    console.log('      No contextual matches found')
    return { content: newContent, linksAdded: 0, appliedProducts: [] }
  }
  
  // Distribute links throughout the article
  const totalParagraphs = Array.from(contextualMatches.keys()).sort((a, b) => a - b)
  const availablePositions = totalParagraphs.length
  
  // Select positions evenly distributed
  const selectedPositions: { paragraphIndex: number; product: ProductIndex; keyword: string }[] = []
  const usedProducts = new Set<string>()
  const usedKeywords = new Set<string>()
  
  if (availablePositions <= MAX_INLINE_LINKS) {
    // Use all available positions
    for (const [paragraphIndex, matches] of contextualMatches) {
      for (const match of matches) {
        if (!usedProducts.has(match.product.id) && !usedKeywords.has(match.keyword.toLowerCase())) {
          selectedPositions.push({
            paragraphIndex,
            product: match.product,
            keyword: match.keyword
          })
          usedProducts.add(match.product.id)
          usedKeywords.add(match.keyword.toLowerCase())
          appliedProducts.push(match.product)
          break
        }
      }
      if (selectedPositions.length >= MAX_INLINE_LINKS) break
    }
  } else {
    // Distribute evenly
    const step = Math.floor(availablePositions / MAX_INLINE_LINKS)
    for (let i = 0; i < MAX_INLINE_LINKS && i < availablePositions; i++) {
      const targetIndex = i * step
      const paragraphIndex = totalParagraphs[Math.min(targetIndex, totalParagraphs.length - 1)]
      const matches = contextualMatches.get(paragraphIndex)
      
      if (matches) {
        for (const match of matches) {
          if (!usedProducts.has(match.product.id) && !usedKeywords.has(match.keyword.toLowerCase())) {
            selectedPositions.push({
              paragraphIndex,
              product: match.product,
              keyword: match.keyword
            })
            usedProducts.add(match.product.id)
            usedKeywords.add(match.keyword.toLowerCase())
            appliedProducts.push(match.product)
            break
          }
        }
      }
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
        const applied = applyLinkToParagraph(node, positionToApply.keyword, positionToApply.product)
        if (applied.modified) {
          linksAdded++
          console.log(`      ✓ Linked "${positionToApply.keyword}" → ${positionToApply.product.product_name.substring(0, 40)}...`)
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
      if (modified) return node
      if (node.type === 'link') return node
      
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
  
  return { content: newContent, linksAdded, appliedProducts }
}

/**
 * Create contextually relevant product recommendation box
 */
function createContextualRecommendationBox(products: ProductIndex[]): any {
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
  
  limitedProducts.forEach((product, index) => {
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
 * Process a single post with contextual linking
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
    
    console.log(`   🔍 Analyzing content for contextual matches...`)
    
    // Apply contextual inline links
    const { content: contentWithLinks, linksAdded, appliedProducts } = applyContextualLinks(post.content, products)
    
    // Remove existing recommendation section if any
    if (!contentWithLinks.root.children) {
      contentWithLinks.root.children = []
    }
    
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
    
    // Add recommendation box with contextually relevant products
    // Prioritize products that were linked inline
    const productsForBox = appliedProducts.length > 0 
      ? appliedProducts.slice(0, MAX_PRODUCTS_BOX)
      : products.slice(0, MAX_PRODUCTS_BOX).map(p => p.product)
    
    if (productsForBox.length > 0) {
      contentWithLinks.root.children.push({
        type: 'horizontalrule',
        version: 1,
      })
      
      const recommendationNodes = createContextualRecommendationBox(productsForBox)
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
    
    if (linksAdded > 0) {
      console.log(`   ✅ Added ${linksAdded} contextually relevant inline links`)
    } else {
      console.log(`   ⚠️  No contextual matches for inline links`)
    }
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
  
  console.log('🎯 Applying CONTEXTUALLY RELEVANT Affiliate Links')
  console.log('=' .repeat(60))
  console.log(`📍 Only linking text that matches product type`)
  console.log(`📊 Maximum ${MAX_INLINE_LINKS} inline links per article`)
  console.log(`📦 Maximum ${MAX_PRODUCTS_BOX} products in recommendation box`)
  console.log(`✨ Examples:`)
  console.log(`   - "ドライバー" links to driver products only`)
  console.log(`   - "パター" links to putter products only`)
  console.log(`   - Generic "ゴルフ" won't link to specific products`)
  
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
      
      console.log(`\n📝 Processing: ${similarity.postSlug}`)
      
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
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   Processed: ${processed} posts`)
    console.log(`   Skipped: ${skipped} posts`)
    console.log(`   Total inline links: ${totalLinksAdded} (contextually relevant)`)
    console.log(`   Total products in boxes: ${totalProductsAdded}`)
    console.log(`   Quality: Only linked matching product types to text`)
    
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