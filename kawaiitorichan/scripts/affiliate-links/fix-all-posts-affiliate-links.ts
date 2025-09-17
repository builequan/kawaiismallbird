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

function cleanNode(node: any): any {
  // Remove any invalid fields from link nodes
  if (node.type === 'link') {
    const cleaned = {
      type: 'link',
      version: 1,
      fields: {
        url: node.fields?.url || '',
        newTab: node.fields?.newTab !== false,
        rel: node.fields?.rel || 'nofollow sponsored'
      },
      children: node.children || []
    }
    // Remove any extra fields like 'doc' that cause validation errors
    return cleaned
  }
  
  if (node.children && Array.isArray(node.children)) {
    node.children = node.children.map(cleanNode)
  }
  
  return node
}

function removeAllAffiliateContent(node: any): any {
  // Remove affiliate links
  if (node.type === 'link' && node.fields?.rel?.includes('sponsored')) {
    // Return just the text content
    if (node.children && node.children.length > 0) {
      return node.children.filter((child: any) => child.type === 'text')
    }
    return null
  }
  
  // Remove おすすめ商品 sections
  if (node.type === 'heading' && node.children?.[0]?.text === 'おすすめ商品') {
    return null
  }
  
  // Remove product paragraphs (those starting with ▶)
  if (node.type === 'paragraph' && node.children?.[0]?.text?.startsWith('▶')) {
    return null
  }
  
  // Remove price paragraphs
  if (node.type === 'paragraph' && node.children?.[0]?.text?.startsWith('価格:')) {
    return null
  }
  
  if (node.children && Array.isArray(node.children)) {
    const newChildren = []
    for (const child of node.children) {
      const result = removeAllAffiliateContent(child)
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
  
  // Clean all nodes first
  for (let i = 0; i < content.root.children.length; i++) {
    content.root.children[i] = cleanNode(content.root.children[i])
  }
  
  // Remove ALL existing affiliate content
  const cleanedChildren = []
  for (let i = 0; i < content.root.children.length; i++) {
    const cleaned = removeAllAffiliateContent(content.root.children[i])
    if (cleaned) {
      cleanedChildren.push(cleaned)
    }
  }
  content.root.children = cleanedChildren
  
  // Keywords to search for
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
  
  // Add inline links
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
        
        // Create proper link structure
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
  
  // Ensure we have at least 3 products for the showcase
  if (addedProducts.length < 3) {
    const additionalProducts = products
      .filter(p => !usedProducts.has(p.id))
      .slice(0, 3 - addedProducts.length)
    
    addedProducts.push(...additionalProducts)
  }
  
  // Add product showcase at the end (with exactly 3 products)
  const showcaseProducts = addedProducts.slice(0, 3)
  if (showcaseProducts.length > 0) {
    // Add heading
    content.root.children.push({
      type: 'heading',
      version: 1,
      tag: 'h3',
      children: [{
        type: 'text',
        text: 'おすすめ商品',
        format: 0,
        version: 1
      }]
    })
    
    // Add products
    for (const product of showcaseProducts) {
      const url = extractAffiliateUrl(product.affiliate_url)
      
      content.root.children.push({
        type: 'paragraph',
        version: 1,
        children: [
          {
            type: 'text',
            text: '▶ ',
            format: 1,
            version: 1
          },
          {
            type: 'link',
            version: 1,
            fields: {
              url: url,
              newTab: true,
              rel: 'nofollow sponsored'
            },
            children: [{
              type: 'text',
              text: product.product_name,
              format: 0,
              version: 1
            }]
          }
        ]
      })
      
      content.root.children.push({
        type: 'paragraph',
        version: 1,
        children: [{
          type: 'text',
          text: `価格: ${product.price}`,
          format: 0,
          version: 1
        }]
      })
    }
  }
  
  return {
    content,
    linksAdded,
    products: showcaseProducts
  }
}

async function main() {
  console.log('🚀 Fixing ALL posts with proper affiliate links\n')
  
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
  let errorCount = 0
  
  for (const post of posts.docs) {
    try {
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
        
        console.log(`   ✅ Added ${result.linksAdded} inline links, ${result.products.length} showcase products`)
        processedCount++
        totalLinksAdded += result.linksAdded
      } else {
        console.log(`   ⚠️  No suitable content for links`)
        skippedCount++
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ PROCESSING COMPLETE!')
  console.log('='.repeat(70))
  console.log(`📊 Statistics:`)
  console.log(`   - Total posts: ${posts.docs.length}`)
  console.log(`   - Processed: ${processedCount}`)
  console.log(`   - Skipped: ${skippedCount}`)
  console.log(`   - Errors: ${errorCount}`)
  console.log(`   - Total links added: ${totalLinksAdded}`)
  console.log(`   - Average links per post: ${processedCount > 0 ? (totalLinksAdded / processedCount).toFixed(1) : 0}`)
  console.log('='.repeat(70))
  
  process.exit(0)
}

main().catch(console.error)