#!/usr/bin/env tsx
/**
 * Apply CONTEXTUALLY RELEVANT affiliate links with proper word boundaries
 * Fixes issue where partial words are matched (e.g., ゴルフ in ゴルファー)
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
 * Check if a character is a Japanese word boundary
 */
function isJapaneseBoundary(char: string): boolean {
  if (!char) return true
  
  // Common Japanese punctuation and spaces
  const boundaries = [
    '。', '、', '！', '？', '（', '）', '「', '」', '『', '』',
    '【', '】', '・', '〜', '　', ' ', '\n', '\t',
    ',', '.', '!', '?', '(', ')', '[', ']', '{', '}',
    ':', ';', '"', "'", '-', '/', '\\'
  ]
  
  return boundaries.includes(char)
}

/**
 * Check if text contains exact word match (not partial)
 */
function hasExactWordMatch(text: string, keyword: string): { found: boolean; index: number } {
  const textLower = text.toLowerCase()
  const keywordLower = keyword.toLowerCase()
  
  // For Japanese text, we need to be more careful about word boundaries
  let index = textLower.indexOf(keywordLower)
  
  while (index !== -1) {
    // Check character before
    const charBefore = index > 0 ? text[index - 1] : ''
    const charAfter = index + keyword.length < text.length ? text[index + keyword.length] : ''
    
    // For Japanese keywords, check if it's a complete word
    const isStartBoundary = index === 0 || isJapaneseBoundary(charBefore) || 
                           (charBefore.match(/[a-zA-Z]/) && !keywordLower[0].match(/[a-zA-Z]/))
    
    const isEndBoundary = index + keyword.length === text.length || 
                         isJapaneseBoundary(charAfter) ||
                         (charAfter.match(/[a-zA-Z]/) && !keywordLower[keywordLower.length - 1].match(/[a-zA-Z]/))
    
    // Special check for compound words
    // Don't match "ゴルフ" in "ゴルファー"
    const isCompound = (keywordLower === 'ゴルフ' && charAfter === 'ァ') ||
                       (keywordLower === 'パット' && charAfter === 'タ') ||
                       (keywordLower === 'ツアー' && (charBefore === 'ア' || charAfter === 'プ'))
    
    if (isStartBoundary && isEndBoundary && !isCompound) {
      return { found: true, index }
    }
    
    // Look for next occurrence
    index = textLower.indexOf(keywordLower, index + 1)
  }
  
  return { found: false, index: -1 }
}

/**
 * Extract specific product type from product name with improved matching
 */
function getProductKeywords(productName: string): string[] {
  const name = productName.toLowerCase()
  const keywords: string[] = []
  
  // Golf club types - be specific
  if (name.includes('ドライバー') || name.includes('driver')) {
    keywords.push('ドライバー', '1番ウッド', 'ティーショット')
  }
  if (name.includes('アイアン') || name.includes('iron')) {
    keywords.push('アイアン', 'アイアンセット')
    // Add specific iron numbers if mentioned
    for (let i = 3; i <= 9; i++) {
      if (name.includes(`${i}番`) || name.includes(`${i}iron`)) {
        keywords.push(`${i}番アイアン`)
      }
    }
  }
  if (name.includes('パター') || name.includes('putter')) {
    keywords.push('パター', 'パッティング')
  }
  if (name.includes('ウェッジ') || name.includes('wedge')) {
    keywords.push('ウェッジ', 'サンドウェッジ', 'ピッチングウェッジ')
  }
  if (name.includes('フェアウェイウッド') || name.includes('fairway')) {
    keywords.push('フェアウェイウッド', '3番ウッド', '5番ウッド')
  }
  if (name.includes('ユーティリティ') || name.includes('utility') || name.includes('hybrid')) {
    keywords.push('ユーティリティ', 'ハイブリッド', 'レスキュー')
  }
  
  // Golf balls - be specific about ball types
  if (name.includes('ボール') || name.includes('ball')) {
    keywords.push('ゴルフボール', '飛距離ボール', 'スピンボール')
    // Don't just match "ボール" alone as it's too generic
  }
  
  // Golf gear with specific terms
  if (name.includes('グローブ') || name.includes('glove')) {
    keywords.push('ゴルフグローブ', 'グローブ')
  }
  if (name.includes('ティー') || name.includes('tee')) {
    keywords.push('ゴルフティー', 'ティーペグ')
  }
  if (name.includes('マーカー') || name.includes('marker')) {
    keywords.push('ボールマーカー', 'マーカー')
  }
  
  // Training aids - be specific
  if (name.includes('スイング') && (name.includes('練習') || name.includes('トレーナー'))) {
    keywords.push('スイング練習器具', 'スイングトレーナー', 'スイング練習')
  }
  if (name.includes('パット') && name.includes('練習')) {
    keywords.push('パター練習器具', 'パット練習', 'パッティング練習')
  }
  if (name.includes('ネット')) {
    keywords.push('練習ネット', 'ゴルフネット', '的ネット')
  }
  if (name.includes('マット')) {
    keywords.push('練習マット', 'ゴルフマット', 'ショットマット')
  }
  
  // Accessories
  if (name.includes('バッグ') || name.includes('bag')) {
    keywords.push('ゴルフバッグ', 'キャディバッグ', 'クラブケース')
  }
  if (name.includes('シューズ') || name.includes('shoe')) {
    keywords.push('ゴルフシューズ', 'スパイクレス')
  }
  
  // Technology
  if (name.includes('gps') || name.includes('距離計') || name.includes('距離測定')) {
    keywords.push('GPS距離計', '距離測定器', 'ゴルフGPS')
  }
  if (name.includes('レーザー') || name.includes('laser')) {
    keywords.push('レーザー距離計', 'レーザー測定器')
  }
  
  // Specific product models or features
  if (name.includes('tour ad')) {
    keywords.push('TOUR AD', 'ツアーAD')
  }
  if (name.includes('飛距離')) {
    keywords.push('飛距離アップ', '飛距離性能')
  }
  if (name.includes('スピン')) {
    keywords.push('スピン性能', 'スピンコントロール')
  }
  
  // Filter out too generic terms
  return keywords.filter(k => 
    k !== 'ゴルフ' && 
    k !== 'golf' && 
    k !== 'クラブ' && 
    k !== 'club' &&
    k !== 'ボール' // Too generic alone
  )
}

/**
 * Find contextually relevant keyword positions with proper word boundaries
 */
function findContextualMatches(content: any, products: Array<{ product: ProductIndex; score: number }>): Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number; exactIndex: number }[]> {
  const positionMap = new Map<number, { product: ProductIndex; keyword: string; paragraphIndex: number; exactIndex: number }[]>()
  let paragraphIndex = 0
  
  function traverse(node: any) {
    if (!node) return
    
    if (node.type === 'paragraph') {
      const textContent = extractText(node)
      const matches: { product: ProductIndex; keyword: string; paragraphIndex: number; exactIndex: number }[] = []
      
      // Check each product
      for (const { product } of products) {
        const productKeywords = getProductKeywords(product.product_name)
        
        // Look for exact word matches only
        for (const keyword of productKeywords) {
          const match = hasExactWordMatch(textContent, keyword)
          if (match.found) {
            matches.push({ 
              product, 
              keyword, 
              paragraphIndex,
              exactIndex: match.index
            })
            break // Only one match per product per paragraph
          }
        }
      }
      
      if (matches.length > 0) {
        // Sort by position in paragraph to link the first occurrence
        matches.sort((a, b) => a.exactIndex - b.exactIndex)
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
      return node.children.map(extractText).join('')
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
 * Apply link to paragraph with exact word matching
 */
function applyLinkToParagraph(paragraph: any, keyword: string, product: ProductIndex): { node: any; modified: boolean } {
  let modified = false
  
  function processNode(node: any): any {
    if (modified) return node
    if (node.type === 'link') return node
    
    if (node.text && typeof node.text === 'string') {
      const match = hasExactWordMatch(node.text, keyword)
      
      if (match.found) {
        const beforeText = node.text.substring(0, match.index)
        const matchedText = node.text.substring(match.index, match.index + keyword.length)
        const afterText = node.text.substring(match.index + keyword.length)
        
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

/**
 * Apply contextually relevant links with proper word boundaries
 */
function applyContextualLinks(content: any, products: Array<{ product: ProductIndex; score: number }>): { content: any; linksAdded: number; appliedProducts: ProductIndex[] } {
  const newContent = JSON.parse(JSON.stringify(content))
  const appliedProducts: ProductIndex[] = []
  
  // Find contextual matches with exact word boundaries
  const contextualMatches = findContextualMatches(newContent, products)
  
  if (contextualMatches.size === 0) {
    console.log('      No exact contextual matches found')
    return { content: newContent, linksAdded: 0, appliedProducts: [] }
  }
  
  // Distribute links throughout the article
  const totalParagraphs = Array.from(contextualMatches.keys()).sort((a, b) => a - b)
  const selectedPositions: { paragraphIndex: number; product: ProductIndex; keyword: string }[] = []
  const usedProducts = new Set<string>()
  const usedKeywords = new Set<string>()
  
  // Select evenly distributed positions
  const step = Math.max(1, Math.floor(totalParagraphs.length / MAX_INLINE_LINKS))
  
  for (let i = 0; i < totalParagraphs.length && selectedPositions.length < MAX_INLINE_LINKS; i += step) {
    const paragraphIndex = totalParagraphs[i]
    const matches = contextualMatches.get(paragraphIndex)
    
    if (matches) {
      for (const match of matches) {
        const keywordKey = match.keyword.toLowerCase()
        if (!usedProducts.has(match.product.id) && !usedKeywords.has(keywordKey)) {
          selectedPositions.push({
            paragraphIndex,
            product: match.product,
            keyword: match.keyword
          })
          usedProducts.add(match.product.id)
          usedKeywords.add(keywordKey)
          appliedProducts.push(match.product)
          break
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
    
    console.log(`   🔍 Analyzing content for exact word matches...`)
    
    // Apply contextual inline links with proper word boundaries
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
      console.log(`   ✅ Added ${linksAdded} exact match links (no partial words)`)
    } else {
      console.log(`   ⚠️  No exact word matches found for linking`)
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
  
  console.log('🎯 Applying Contextual Links with Proper Word Boundaries')
  console.log('=' .repeat(60))
  console.log(`📍 Only linking complete words (not partial matches)`)
  console.log(`📊 Maximum ${MAX_INLINE_LINKS} inline links per article`)
  console.log(`📦 Maximum ${MAX_PRODUCTS_BOX} products in recommendation box`)
  console.log(`✨ Examples:`)
  console.log(`   ✓ "ドライバー" links to driver products`)
  console.log(`   ✓ "パター" links to putter products`)
  console.log(`   ✗ "ゴルフ" in "ゴルファー" won't be linked`)
  console.log(`   ✗ "ツアー" in "ツアープロ" won't be linked`)
  
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
    console.log(`   Total inline links: ${totalLinksAdded} (exact word matches only)`)
    console.log(`   Total products in boxes: ${totalProductsAdded}`)
    console.log(`   Quality: No partial word matching`)
    
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