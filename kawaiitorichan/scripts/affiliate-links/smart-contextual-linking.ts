#!/usr/bin/env tsx
/**
 * Smart Contextual Linking System
 * - Finds natural phrases in articles
 * - Matches contextually relevant products
 * - Inserts 6 relevant links per article
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const LINKS_PER_POST = 6

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  anchorPhrases: string[]
  language: string
  affiliate_url: string
  clean_url: string
  price: string
  description: string
}

interface LinkCandidate {
  product: ProductIndex
  phrase: string
  position: number
  score: number
  context: string
}

/**
 * Extract clean affiliate URL
 */
function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

/**
 * Extract text from Lexical editor blocks
 */
function extractTextFromLexical(content: any): string[] {
  const texts: string[] = []
  
  if (!content || !content.root) return texts
  
  function extractFromNode(node: any): void {
    if (!node) return
    
    // Handle text nodes
    if (node.type === 'text' && node.text) {
      texts.push(node.text)
    }
    
    // Handle paragraph nodes
    if (node.type === 'paragraph' && node.children) {
      const paragraphText = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.text || '')
        .join('')
      if (paragraphText) {
        texts.push(paragraphText)
      }
    }
    
    // Handle heading nodes
    if (node.type === 'heading' && node.children) {
      const headingText = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.text || '')
        .join('')
      if (headingText) {
        texts.push(headingText)
      }
    }
    
    // Handle list items
    if (node.type === 'listitem' && node.children) {
      for (const child of node.children) {
        extractFromNode(child)
      }
    }
    
    // Handle blocks with children
    if (node.type === 'block' && node.fields?.richText) {
      extractFromNode(node.fields.richText)
    }
    
    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        extractFromNode(child)
      }
    }
  }
  
  extractFromNode(content.root)
  return texts
}

/**
 * Find natural link insertion points in content
 */
function findNaturalPhrases(content: string, products: ProductIndex[]): LinkCandidate[] {
  const candidates: LinkCandidate[] = []
  const contentLower = content.toLowerCase()
  
  for (const product of products) {
    // Check all possible anchor phrases for this product
    const phrasesToCheck = [
      product.keyword_research,
      ...product.keywords,
      ...product.anchorPhrases
    ].filter(phrase => phrase && phrase.length > 0)
    
    for (const phrase of phrasesToCheck) {
      if (!phrase) continue
      
      const phraseLower = phrase.toLowerCase()
      let position = 0
      
      // Find all occurrences of this phrase
      while ((position = contentLower.indexOf(phraseLower, position)) !== -1) {
        // Get context around the phrase (50 chars before and after)
        const contextStart = Math.max(0, position - 50)
        const contextEnd = Math.min(content.length, position + phrase.length + 50)
        const context = content.substring(contextStart, contextEnd)
        
        // Calculate relevance score based on context
        const score = calculateContextScore(context, product, phrase)
        
        if (score > 0.3) { // Only include if relevance is high enough
          candidates.push({
            product,
            phrase: content.substring(position, position + phrase.length), // Preserve original case
            position,
            score,
            context
          })
        }
        
        position += phrase.length
      }
    }
  }
  
  return candidates
}

/**
 * Calculate context-based relevance score
 */
function calculateContextScore(context: string, product: ProductIndex, matchedPhrase: string): number {
  let score = 0.5 // Base score for phrase match
  const contextLower = context.toLowerCase()
  
  // Golf-specific context keywords that boost relevance
  const golfContextKeywords = [
    'ゴルフ', 'スイング', 'ショット', 'クラブ', 'ボール', 'ティー',
    'グリーン', 'フェアウェイ', 'バンカー', 'パター', 'ドライバー',
    'アイアン', 'ウェッジ', 'グリップ', '飛距離', 'スコア', '練習',
    'ラウンド', 'コース', 'プロ', 'アマチュア', '初心者', '上級者'
  ]
  
  // Check for golf context
  for (const keyword of golfContextKeywords) {
    if (contextLower.includes(keyword.toLowerCase())) {
      score += 0.1
    }
  }
  
  // Check for product-specific keywords in context
  for (const keyword of product.keywords) {
    if (keyword !== matchedPhrase && contextLower.includes(keyword.toLowerCase())) {
      score += 0.15
    }
  }
  
  // Boost score if product type matches context
  if (product.product_name.includes('ドライバー') && contextLower.includes('ティーショット')) {
    score += 0.2
  }
  if (product.product_name.includes('パター') && (contextLower.includes('グリーン') || contextLower.includes('パット'))) {
    score += 0.2
  }
  if (product.product_name.includes('ウェッジ') && (contextLower.includes('アプローチ') || contextLower.includes('バンカー'))) {
    score += 0.2
  }
  if (product.product_name.includes('ボール') && (contextLower.includes('飛距離') || contextLower.includes('スピン'))) {
    score += 0.2
  }
  
  return Math.min(score, 1.0) // Cap at 1.0
}

/**
 * Select best candidates ensuring diversity
 */
function selectBestCandidates(candidates: LinkCandidate[], limit: number): LinkCandidate[] {
  // Sort by score
  candidates.sort((a, b) => b.score - a.score)
  
  const selected: LinkCandidate[] = []
  const usedProducts = new Set<string>()
  const usedPositions = new Set<number>()
  const minDistance = 100 // Minimum character distance between links
  
  for (const candidate of candidates) {
    // Skip if product already used
    if (usedProducts.has(candidate.product.id)) continue
    
    // Skip if too close to another link
    let tooClose = false
    for (const pos of usedPositions) {
      if (Math.abs(candidate.position - pos) < minDistance) {
        tooClose = true
        break
      }
    }
    if (tooClose) continue
    
    // Add to selected
    selected.push(candidate)
    usedProducts.add(candidate.product.id)
    usedPositions.add(candidate.position)
    
    if (selected.length >= limit) break
  }
  
  // Sort by position for proper insertion
  return selected.sort((a, b) => a.position - b.position)
}

/**
 * Insert links into Lexical content
 */
function insertLinksIntoLexical(content: any, candidates: LinkCandidate[]): any {
  if (!content || !content.root) return content
  
  // Create a map of positions to links
  const linkMap = new Map<string, LinkCandidate>()
  for (const candidate of candidates) {
    linkMap.set(candidate.phrase.toLowerCase(), candidate)
  }
  
  // Recursively process nodes
  function processNode(node: any): any {
    if (node.type === 'text' && node.text) {
      const textLower = node.text.toLowerCase()
      
      // Check if this text contains any phrases to link
      for (const [phraseLower, candidate] of linkMap) {
        if (textLower.includes(phraseLower)) {
          // Find exact position in original text
          const index = textLower.indexOf(phraseLower)
          if (index !== -1) {
            const originalPhrase = node.text.substring(index, index + phraseLower.length)
            const url = extractAffiliateUrl(candidate.product.affiliate_url)
            
            // Split the text and create link node
            const before = node.text.substring(0, index)
            const after = node.text.substring(index + originalPhrase.length)
            
            const linkNode = {
              type: 'link',
              fields: {
                url: url,
                newTab: true,
                rel: 'nofollow sponsored'
              },
              children: [{
                type: 'text',
                text: originalPhrase,
                format: 0
              }]
            }
            
            // Return array of nodes
            const result = []
            if (before) result.push({ ...node, text: before })
            result.push(linkNode)
            if (after) result.push({ ...node, text: after })
            
            // Remove this link from the map so it's not inserted again
            linkMap.delete(phraseLower)
            
            return result
          }
        }
      }
    }
    
    // Process children
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
      return { ...node, children: newChildren }
    }
    
    return node
  }
  
  return {
    ...content,
    root: processNode(content.root)
  }
}

/**
 * Create product showcase section
 */
function createProductShowcase(products: ProductIndex[]): any {
  const showcaseNodes = []
  
  // Add heading
  showcaseNodes.push({
    type: 'heading',
    tag: 'h3',
    children: [{
      type: 'text',
      text: '関連商品のご紹介',
      format: 0
    }]
  })
  
  // Add each product
  for (const product of products.slice(0, 3)) { // Show top 3 as showcase
    const url = extractAffiliateUrl(product.affiliate_url)
    
    showcaseNodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: '▶ ',
          format: 1 // Bold
        },
        {
          type: 'link',
          fields: {
            url: url,
            newTab: true,
            rel: 'nofollow sponsored'
          },
          children: [{
            type: 'text',
            text: product.product_name,
            format: 0
          }]
        }
      ]
    })
    
    showcaseNodes.push({
      type: 'paragraph',
      children: [{
        type: 'text',
        text: `価格: ${product.price}`,
        format: 0
      }]
    })
  }
  
  return showcaseNodes
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🎯 Smart Contextual Linking System Starting...')
    
    // Load products
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    if (!await fs.access(productsPath).then(() => true).catch(() => false)) {
      console.error('❌ Products index not found. Run import-products.ts first.')
      process.exit(1)
    }
    
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    console.log(`📦 Loaded ${products.length} products`)
    
    // Get posts to process
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : 10
    
    const posts = await payload.find({
      collection: 'posts',
      limit: limit,
      where: {
        _status: {
          equals: 'published'
        }
      }
    })
    
    console.log(`📝 Processing ${posts.docs.length} posts`)
    
    let processed = 0
    let totalLinksAdded = 0
    
    for (const post of posts.docs) {
      try {
        console.log(`\n🔍 Processing: ${post.title}`)
        
        // Extract all text content from the post
        const textParagraphs = extractTextFromLexical(post.content)
        const fullContent = textParagraphs.join(' ')
        
        if (!fullContent || fullContent.length < 100) {
          console.log('   ⏭️  Skipping - insufficient content')
          continue
        }
        
        // Find natural linking opportunities
        const candidates = findNaturalPhrases(fullContent, products)
        console.log(`   📍 Found ${candidates.length} potential link positions`)
        
        // Select best candidates
        const selectedCandidates = selectBestCandidates(candidates, LINKS_PER_POST)
        console.log(`   ✅ Selected ${selectedCandidates.length} best matches`)
        
        if (selectedCandidates.length === 0) {
          console.log('   ⚠️  No suitable matches found')
          continue
        }
        
        // Log selected products
        for (const candidate of selectedCandidates) {
          console.log(`      - "${candidate.phrase}" → ${candidate.product.product_name} (score: ${candidate.score.toFixed(2)})`)
        }
        
        // Insert links into content
        const updatedContent = insertLinksIntoLexical(post.content, selectedCandidates)
        
        // Add product showcase at the end if we have enough products
        if (selectedCandidates.length >= 3) {
          const showcaseProducts = selectedCandidates.map(c => c.product)
          const showcaseNodes = createProductShowcase(showcaseProducts)
          
          if (!updatedContent.root.children) {
            updatedContent.root.children = []
          }
          updatedContent.root.children.push(...showcaseNodes)
        }
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent
          }
        })
        
        processed++
        totalLinksAdded += selectedCandidates.length
        
        console.log(`   ✨ Successfully added ${selectedCandidates.length} contextual links`)
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Smart Contextual Linking Complete!')
    console.log('='.repeat(60))
    console.log(`📊 Results:`)
    console.log(`   📝 Posts processed: ${processed}`)
    console.log(`   🔗 Total links added: ${totalLinksAdded}`)
    console.log(`   📈 Average links per post: ${(totalLinksAdded / processed).toFixed(1)}`)
    console.log('='.repeat(60))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main().catch(console.error)