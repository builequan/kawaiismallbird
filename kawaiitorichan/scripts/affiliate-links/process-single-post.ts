#!/usr/bin/env tsx
/**
 * Process a single post with affiliate links for demonstration
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_LINKS = 6

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  anchorPhrases: string[]
  affiliate_url: string
  price: string
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  return match?.[1] || ''
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🎯 Processing Japanese Article for Affiliate Links Demo\n')
  console.log('=' .repeat(70))
  
  // Load products
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  
  // Get the Japanese post
  const post = await payload.findByID({
    collection: 'posts',
    id: '424'
  })
  
  if (!post) {
    console.log('Post not found')
    process.exit(1)
  }
  
  console.log(`📄 Article: ${post.title}`)
  console.log(`🔗 URL: /posts/${post.slug}\n`)
  
  // First, remove any existing links
  console.log('Step 1: Removing any existing affiliate links...')
  
  function removeLinks(node: any): any {
    if (!node) return node
    
    if (node.type === 'link' && node.children) {
      const textNodes = node.children.filter((c: any) => c.type === 'text')
      return textNodes.length > 0 ? textNodes : null
    }
    
    if (node.children && Array.isArray(node.children)) {
      const newChildren = []
      for (const child of node.children) {
        const processed = removeLinks(child)
        if (processed) {
          if (Array.isArray(processed)) {
            newChildren.push(...processed)
          } else {
            newChildren.push(processed)
          }
        }
      }
      return { ...node, children: newChildren }
    }
    
    return node
  }
  
  // Clean content
  let cleanContent = JSON.parse(JSON.stringify(post.content))
  cleanContent.root = removeLinks(cleanContent.root)
  
  // Remove any existing showcase section
  if (cleanContent.root.children) {
    cleanContent.root.children = cleanContent.root.children.filter((node: any) => {
      if (node.type === 'heading' && node.children) {
        const text = node.children
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('')
        return !text.includes('おすすめ商品')
      }
      return true
    })
  }
  
  console.log('✅ Cleaned existing links\n')
  
  // Find relevant products for this post
  console.log('Step 2: Finding relevant products...')
  
  const relevantProducts: Array<{product: ProductIndex, keyword: string, score: number}> = []
  
  // Extract all text from content
  function extractText(node: any): string {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (node.children) {
      return node.children.map((c: any) => extractText(c)).join(' ')
    }
    return ''
  }
  
  const fullText = extractText(cleanContent.root).toLowerCase()
  
  // Score each product
  for (const product of products) {
    let bestMatch = { keyword: '', score: 0 }
    
    // Check primary keyword
    if (product.keyword_research && fullText.includes(product.keyword_research.toLowerCase())) {
      bestMatch = { keyword: product.keyword_research, score: 0.8 }
    }
    
    // Check other keywords
    for (const kw of [...product.keywords, ...product.anchorPhrases]) {
      if (kw && fullText.includes(kw.toLowerCase())) {
        const score = 0.6
        if (score > bestMatch.score) {
          bestMatch = { keyword: kw, score }
        }
      }
    }
    
    // Golf-specific boost
    if (bestMatch.score > 0) {
      if (product.product_name.includes('ゴルフ')) bestMatch.score += 0.1
      if (product.product_name.includes('レッスン')) bestMatch.score += 0.15
      if (product.product_name.includes('初心者')) bestMatch.score += 0.15
      if (product.product_name.includes('練習')) bestMatch.score += 0.1
    }
    
    if (bestMatch.score > 0.3) {
      relevantProducts.push({
        product,
        keyword: bestMatch.keyword,
        score: Math.min(bestMatch.score, 1.0)
      })
    }
  }
  
  // Sort by relevance and take top products
  relevantProducts.sort((a, b) => b.score - a.score)
  const selectedProducts = relevantProducts.slice(0, MAX_LINKS)
  
  console.log(`✅ Found ${selectedProducts.length} relevant products\n`)
  
  // Show selected products
  console.log('Step 3: Adding inline links for these products:')
  console.log('-' .repeat(70))
  
  // Add inline links
  const usedProducts = new Set<string>()
  let linksAdded = 0
  
  for (const item of selectedProducts) {
    if (usedProducts.has(item.product.id)) continue
    
    // Find the keyword in content and add link
    let linkAdded = false
    
    function addLink(node: any, level: number = 0): boolean {
      if (linkAdded) return true
      if (!node) return false
      
      if (node.type === 'paragraph' && node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i]
          if (child.type === 'text' && child.text) {
            const textLower = child.text.toLowerCase()
            const kwLower = item.keyword.toLowerCase()
            const pos = textLower.indexOf(kwLower)
            
            if (pos !== -1) {
              const before = child.text.substring(0, pos)
              const linkText = child.text.substring(pos, pos + item.keyword.length)
              const after = child.text.substring(pos + item.keyword.length)
              
              const url = extractAffiliateUrl(item.product.affiliate_url)
              
              const newNodes = []
              if (before) newNodes.push({ type: 'text', text: before, format: 0 })
              newNodes.push({
                type: 'link',
                fields: {
                  url: url,
                  newTab: true,
                  rel: 'nofollow sponsored'
                },
                children: [{ type: 'text', text: linkText, format: 0 }]
              })
              if (after) newNodes.push({ type: 'text', text: after, format: 0 })
              
              node.children.splice(i, 1, ...newNodes)
              linkAdded = true
              linksAdded++
              
              console.log(`${linksAdded}. Keyword: "${item.keyword}"`)
              console.log(`   → Product: ${item.product.product_name.substring(0, 60)}...`)
              console.log(`   Price: ${item.product.price}`)
              console.log('')
              
              return true
            }
          }
        }
      }
      
      if (node.children) {
        for (const child of node.children) {
          if (addLink(child, level + 1)) return true
        }
      }
      
      return false
    }
    
    if (cleanContent.root.children) {
      for (const node of cleanContent.root.children) {
        if (addLink(node)) {
          usedProducts.add(item.product.id)
          break
        }
      }
    }
  }
  
  console.log('-' .repeat(70))
  console.log(`✅ Added ${linksAdded} inline affiliate links\n`)
  
  // Add product showcase at the end
  console.log('Step 4: Adding product showcase section at the end:')
  console.log('-' .repeat(70))
  console.log('【おすすめ商品】\n')
  
  if (selectedProducts.length >= 3) {
    // Add showcase heading
    cleanContent.root.children.push({
      type: 'heading',
      tag: 'h3',
      children: [{
        type: 'text',
        text: 'おすすめ商品',
        format: 0
      }]
    })
    
    // Add top 3 products
    for (const item of selectedProducts.slice(0, 3)) {
      const url = extractAffiliateUrl(item.product.affiliate_url)
      
      // Product name with link
      cleanContent.root.children.push({
        type: 'paragraph',
        children: [
          { type: 'text', text: '▶ ', format: 1 },
          {
            type: 'link',
            fields: {
              url: url,
              newTab: true,
              rel: 'nofollow sponsored'
            },
            children: [{
              type: 'text',
              text: item.product.product_name,
              format: 0
            }]
          }
        ]
      })
      
      // Price
      cleanContent.root.children.push({
        type: 'paragraph',
        children: [{
          type: 'text',
          text: `価格: ${item.product.price}`,
          format: 0
        }]
      })
      
      console.log(`▶ ${item.product.product_name}`)
      console.log(`  価格: ${item.product.price}\n`)
    }
  }
  
  console.log('-' .repeat(70))
  
  // Update the post
  console.log('\nStep 5: Saving changes...')
  
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: cleanContent
    }
  })
  
  console.log('✅ Post updated successfully!\n')
  
  console.log('=' .repeat(70))
  console.log('📊 FINAL RESULT SUMMARY:')
  console.log('=' .repeat(70))
  console.log(`📄 Article: ${post.title}`)
  console.log(`🔗 URL: http://localhost:3000/posts/${post.slug}`)
  console.log(`📍 Inline Links Added: ${linksAdded}`)
  console.log(`🎁 Product Showcase: ${Math.min(3, selectedProducts.length)} products`)
  console.log(`✨ Total Affiliate Links: ${linksAdded + Math.min(3, selectedProducts.length)}`)
  console.log('=' .repeat(70))
  console.log('\n✅ Visit the article to see the affiliate links in action!')
  
  process.exit(0)
}

main().catch(console.error)