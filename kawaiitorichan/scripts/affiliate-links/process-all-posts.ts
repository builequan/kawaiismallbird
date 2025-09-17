#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_INLINE_LINKS = 6

interface ProductIndex {
  id: string
  product_name: string
  affiliate_url: string
  price: string
  keywords: string[]
  anchorPhrases: string[]
  keyword_research: string
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

function removeAllAffiliateLinks(node: any): any {
  if (node.type === 'link' && node.fields?.rel?.includes('sponsored')) {
    if (node.children && node.children.length > 0) {
      return node.children.filter((child: any) => child.type === 'text')
    }
    return null
  }
  
  if (node.children && Array.isArray(node.children)) {
    const newChildren = []
    for (const child of node.children) {
      const result = removeAllAffiliateLinks(child)
      if (result) {
        if (Array.isArray(result)) {
          newChildren.push(...result)
        } else {
          newChildren.push(result)
        }
      }
    }
    node.children = newChildren
  }
  
  return node
}

async function processPost(post: any, products: ProductIndex[]) {
  const content = JSON.parse(JSON.stringify(post.content))
  
  // Remove existing affiliate links first
  for (let i = 0; i < content.root.children.length; i++) {
    content.root.children[i] = removeAllAffiliateLinks(content.root.children[i])
  }
  
  // Common golf keywords to look for
  const keywordsToFind = [
    'ゴルフ', 'スイング', 'グリップ', 'クラブ', 'ボール',
    'アイアン', 'ドライバー', 'パター', 'ウェッジ', '練習',
    'レッスン', 'ティー', 'フェアウェイ', 'グリーン', 'バンカー',
    'スコア', 'パー', 'バーディー', 'イーグル', 'ボギー'
  ]
  
  const usedKeywords = new Set<string>()
  const usedProducts = new Set<string>()
  const addedProducts: ProductIndex[] = []
  let linksAdded = 0
  
  // Try to add links based on content
  for (let i = 0; i < content.root.children.length && linksAdded < MAX_INLINE_LINKS; i++) {
    const node = content.root.children[i]
    
    if (node.type !== 'paragraph' || !node.children) continue
    
    for (let j = 0; j < node.children.length && linksAdded < MAX_INLINE_LINKS; j++) {
      const child = node.children[j]
      
      if (child.type !== 'text' || !child.text) continue
      
      for (const keyword of keywordsToFind) {
        if (usedKeywords.has(keyword)) continue
        if (linksAdded >= MAX_INLINE_LINKS) break
        
        const pos = child.text.indexOf(keyword)
        if (pos === -1) continue
        
        // Find a matching product
        const matchingProduct = products.find(p => {
          if (usedProducts.has(p.id)) return false
          
          const allText = [
            p.product_name,
            p.keyword_research,
            ...p.keywords,
            ...p.anchorPhrases
          ].filter(k => k).join(' ')
          
          return allText.includes(keyword)
        })
        
        if (!matchingProduct) continue
        
        // Add the link
        const before = child.text.substring(0, pos)
        const linkText = child.text.substring(pos, pos + keyword.length)
        const after = child.text.substring(pos + keyword.length)
        
        const newNodes = []
        
        if (before) {
          newNodes.push({
            type: 'text',
            text: before,
            format: child.format || 0,
            version: 1
          })
        }
        
        newNodes.push({
          type: 'link',
          version: 1,
          fields: {
            url: extractAffiliateUrl(matchingProduct.affiliate_url),
            newTab: true,
            rel: 'nofollow sponsored'
          },
          children: [{
            type: 'text',
            text: linkText,
            format: 0,
            version: 1
          }]
        })
        
        if (after) {
          newNodes.push({
            type: 'text',
            text: after,
            format: child.format || 0,
            version: 1
          })
        }
        
        node.children.splice(j, 1, ...newNodes)
        
        linksAdded++
        usedKeywords.add(keyword)
        usedProducts.add(matchingProduct.id)
        addedProducts.push(matchingProduct)
        
        j += newNodes.length - 1
        break
      }
    }
  }
  
  // If not enough links added, add some popular products
  if (addedProducts.length < 3) {
    const popularProducts = products
      .filter(p => !usedProducts.has(p.id))
      .slice(0, 3 - addedProducts.length)
    
    addedProducts.push(...popularProducts)
  }
  
  return {
    content,
    linksAdded,
    products: addedProducts.slice(0, 3) // Ensure we have at least 3 products for the box
  }
}

async function main() {
  console.log('🚀 Processing ALL posts to add affiliate links\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Load products
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  console.log(`Loaded ${products.length} products\n`)
  
  // Get ALL published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' }
    },
    limit: 1000
  })
  
  console.log(`Found ${posts.docs.length} posts to process\n`)
  
  let processedCount = 0
  let totalLinksAdded = 0
  let skippedCount = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children?.length) {
      console.log(`⏭️  Skipping ${post.title} - no content`)
      skippedCount++
      continue
    }
    
    console.log(`📝 Processing: ${post.title}`)
    
    const result = await processPost(post, products)
    
    if (result.linksAdded > 0 || result.products.length > 0) {
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: result.content
        }
      })
      
      console.log(`   ✅ Added ${result.linksAdded} links, ${result.products.length} products for showcase`)
      processedCount++
      totalLinksAdded += result.linksAdded
    } else {
      console.log(`   ⚠️  No suitable content for links`)
      skippedCount++
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ PROCESSING COMPLETE!')
  console.log('='.repeat(70))
  console.log(`📊 Statistics:`)
  console.log(`   - Total posts: ${posts.docs.length}`)
  console.log(`   - Processed: ${processedCount}`)
  console.log(`   - Skipped: ${skippedCount}`)
  console.log(`   - Total links added: ${totalLinksAdded}`)
  console.log(`   - Average links per post: ${processedCount > 0 ? (totalLinksAdded / processedCount).toFixed(1) : 0}`)
  console.log('='.repeat(70))
  
  process.exit(0)
}

main().catch(console.error)