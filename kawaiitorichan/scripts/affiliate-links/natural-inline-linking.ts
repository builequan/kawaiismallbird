#!/usr/bin/env tsx
/**
 * Natural Inline Linking System
 * Inserts 6 contextually relevant affiliate links naturally within article text
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
  affiliate_url: string
  price: string
}

interface LinkMatch {
  product: ProductIndex
  phrase: string
  nodeIndex: number
  textIndex: number
  position: number
  score: number
}

/**
 * Extract clean URL from affiliate HTML
 */
function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  return match?.[1] || ''
}

/**
 * Calculate relevance score for product-phrase match
 */
function calculateRelevance(text: string, product: ProductIndex): number {
  const textLower = text.toLowerCase()
  let score = 0
  
  // Check primary keyword
  if (product.keyword_research && textLower.includes(product.keyword_research.toLowerCase())) {
    score += 0.5
  }
  
  // Check secondary keywords
  for (const kw of product.keywords.slice(0, 3)) {
    if (kw && textLower.includes(kw.toLowerCase())) {
      score += 0.2
    }
  }
  
  // Golf context boost
  const golfTerms = ['ゴルフ', 'クラブ', 'スイング', 'ショット', 'ドライバー', 'アイアン', 'パター', 'ウェッジ']
  for (const term of golfTerms) {
    if (textLower.includes(term.toLowerCase())) {
      score += 0.1
      break
    }
  }
  
  return Math.min(score, 1.0)
}

/**
 * Find best linking opportunities in Lexical content
 */
function findLinkOpportunities(content: any, products: ProductIndex[]): LinkMatch[] {
  const matches: LinkMatch[] = []
  
  if (!content?.root?.children) return matches
  
  // Process each paragraph/heading
  content.root.children.forEach((node: any, nodeIndex: number) => {
    if (!['paragraph', 'heading'].includes(node.type)) return
    if (!node.children) return
    
    // Process each text node
    node.children.forEach((child: any, textIndex: number) => {
      if (child.type !== 'text' || !child.text) return
      
      const text = child.text
      const textLower = text.toLowerCase()
      
      // Check each product's keywords
      for (const product of products) {
        const phrasesToCheck = [
          product.keyword_research,
          ...product.keywords.slice(0, 3),
          ...product.anchorPhrases.slice(0, 2)
        ].filter(p => p && p.length > 1)
        
        for (const phrase of phrasesToCheck) {
          const phraseLower = phrase.toLowerCase()
          const position = textLower.indexOf(phraseLower)
          
          if (position !== -1) {
            // Extract actual phrase with original casing
            const actualPhrase = text.substring(position, position + phrase.length)
            
            // Calculate relevance score
            const contextStart = Math.max(0, position - 50)
            const contextEnd = Math.min(text.length, position + phrase.length + 50)
            const context = text.substring(contextStart, contextEnd)
            const score = calculateRelevance(context, product)
            
            if (score > 0.3) {
              matches.push({
                product,
                phrase: actualPhrase,
                nodeIndex,
                textIndex,
                position,
                score
              })
            }
          }
        }
      }
    })
  })
  
  return matches
}

/**
 * Select diverse, well-distributed links
 */
function selectBestLinks(matches: LinkMatch[], limit: number): LinkMatch[] {
  // Sort by score
  matches.sort((a, b) => b.score - a.score)
  
  const selected: LinkMatch[] = []
  const usedProducts = new Set<string>()
  const usedNodes = new Map<number, number>() // node index -> count
  
  for (const match of matches) {
    // Skip if product already used
    if (usedProducts.has(match.product.id)) continue
    
    // Limit links per node to maintain readability
    const nodeCount = usedNodes.get(match.nodeIndex) || 0
    if (nodeCount >= 2) continue
    
    selected.push(match)
    usedProducts.add(match.product.id)
    usedNodes.set(match.nodeIndex, nodeCount + 1)
    
    if (selected.length >= limit) break
  }
  
  // Sort by position for proper insertion (reverse order for safe replacement)
  return selected.sort((a, b) => {
    if (a.nodeIndex !== b.nodeIndex) return b.nodeIndex - a.nodeIndex
    if (a.textIndex !== b.textIndex) return b.textIndex - a.textIndex
    return b.position - a.position
  })
}

/**
 * Apply links to Lexical content
 */
function applyLinksToContent(content: any, links: LinkMatch[]): any {
  if (!content?.root?.children) return content
  
  // Deep clone the content
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Apply each link
  for (const link of links) {
    const node = newContent.root.children[link.nodeIndex]
    if (!node?.children?.[link.textIndex]) continue
    
    const textNode = node.children[link.textIndex]
    if (textNode.type !== 'text' || !textNode.text) continue
    
    const text = textNode.text
    const url = extractAffiliateUrl(link.product.affiliate_url)
    
    // Split text and insert link
    const before = text.substring(0, link.position)
    const linkText = text.substring(link.position, link.position + link.phrase.length)
    const after = text.substring(link.position + link.phrase.length)
    
    const newChildren = []
    
    // Add text before link
    if (before) {
      newChildren.push({
        type: 'text',
        text: before,
        format: textNode.format || 0
      })
    }
    
    // Add link
    newChildren.push({
      type: 'link',
      fields: {
        url: url,
        newTab: true,
        rel: 'nofollow sponsored'
      },
      children: [{
        type: 'text',
        text: linkText,
        format: 0
      }]
    })
    
    // Add text after link
    if (after) {
      newChildren.push({
        type: 'text',
        text: after,
        format: textNode.format || 0
      })
    }
    
    // Replace the text node with the new nodes
    node.children.splice(link.textIndex, 1, ...newChildren)
  }
  
  return newContent
}

/**
 * Add product showcase section
 */
function addProductShowcase(content: any, products: ProductIndex[]): any {
  if (!content?.root?.children) return content
  if (products.length === 0) return content
  
  // Show up to 3 products (but at least show what we have)
  const showcaseProducts = products.slice(0, 3)
  
  // Add section heading
  content.root.children.push({
    type: 'heading',
    tag: 'h3',
    children: [{
      type: 'text',
      text: 'おすすめ商品',
      format: 0
    }]
  })
  
  // Add product list
  for (const product of showcaseProducts) {
    const url = extractAffiliateUrl(product.affiliate_url)
    
    // Product name with link
    content.root.children.push({
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
    
    // Price
    content.root.children.push({
      type: 'paragraph',
      children: [{
        type: 'text',
        text: `価格: ${product.price}`,
        format: 0
      }]
    })
  }
  
  return content
}

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🎯 Natural Inline Linking System')
    console.log('=' .repeat(60))
    
    // Load products
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    console.log(`📦 Loaded ${products.length} products`)
    
    // Get posts
    const limit = process.argv.includes('--limit') 
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) 
      : 10
    
    const posts = await payload.find({
      collection: 'posts',
      limit,
      where: {
        _status: { equals: 'published' }
      }
    })
    
    console.log(`📝 Processing ${posts.docs.length} posts\n`)
    
    let successCount = 0
    let totalLinks = 0
    
    for (const post of posts.docs) {
      try {
        console.log(`\n📄 ${post.title}`)
        
        if (!post.content?.root?.children?.length) {
          console.log('   ⏭️  No content found')
          continue
        }
        
        // Find link opportunities
        const opportunities = findLinkOpportunities(post.content, products)
        console.log(`   📍 Found ${opportunities.length} potential positions`)
        
        // Select best links
        const selectedLinks = selectBestLinks(opportunities, LINKS_PER_POST)
        console.log(`   ✅ Selected ${selectedLinks.length} links`)
        
        if (selectedLinks.length === 0) {
          console.log('   ⚠️  No suitable matches')
          continue
        }
        
        // Show selected links
        for (const link of selectedLinks) {
          console.log(`      → "${link.phrase}" ➜ ${link.product.product_name.substring(0, 50)}...`)
        }
        
        // Apply links
        let updatedContent = applyLinksToContent(post.content, selectedLinks)
        
        // Add showcase if enough products
        const showcaseProducts = selectedLinks.map(l => l.product)
        updatedContent = addProductShowcase(updatedContent, showcaseProducts)
        
        // Update post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent
          }
        })
        
        successCount++
        totalLinks += selectedLinks.length
        console.log(`   ✨ Successfully updated`)
        
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`)
      }
    }
    
    console.log('\n' + '=' .repeat(60))
    console.log('📊 Summary:')
    console.log(`   ✅ Posts updated: ${successCount}`)
    console.log(`   🔗 Total links added: ${totalLinks}`)
    console.log(`   📈 Average per post: ${(totalLinks / successCount).toFixed(1)}`)
    console.log('=' .repeat(60))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

main().catch(console.error)