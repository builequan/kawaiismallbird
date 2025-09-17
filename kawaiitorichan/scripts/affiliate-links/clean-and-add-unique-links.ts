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
    // Return just the text content
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

async function main() {
  console.log('🔗 Adding unique affiliate links (one per keyword)\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get the post
  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: 'your-first-golf-lesson-what-to-expect-and-how-to-prepare-japanese' }
    }
  })
  
  if (!posts.docs.length) {
    console.log('Post not found')
    process.exit(1)
  }
  
  const post = posts.docs[0]
  console.log(`📄 Processing: ${post.title}\n`)
  
  // Load products
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  
  const content = JSON.parse(JSON.stringify(post.content))
  
  // Step 1: Remove ALL existing affiliate links
  console.log('Step 1: Removing all existing affiliate links...')
  for (let i = 0; i < content.root.children.length; i++) {
    content.root.children[i] = removeAllAffiliateLinks(content.root.children[i])
  }
  console.log('✅ Cleaned all affiliate links\n')
  
  // Step 2: Add unique links (one per keyword)
  console.log('Step 2: Adding unique affiliate links...')
  
  // Priority keywords to link - diverse set
  const keywordsToLink = [
    { keyword: 'スイング', product: null },
    { keyword: 'グリップ', product: null },
    { keyword: 'クラブ', product: null },
    { keyword: 'ボール', product: null },
    { keyword: 'アイアン', product: null },
    { keyword: '練習', product: null }
  ]
  
  // Find best product for each keyword
  for (const kw of keywordsToLink) {
    const matching = products.find(p => {
      const allText = [
        p.product_name,
        p.keyword_research,
        ...p.keywords,
        ...p.anchorPhrases
      ].filter(k => k).join(' ')
      
      return allText.includes(kw.keyword)
    })
    
    if (matching) {
      kw.product = matching
    }
  }
  
  // Filter to only keywords with products
  const validKeywords = keywordsToLink.filter(kw => kw.product !== null)
  
  let linksAdded = 0
  const usedKeywords = new Set<string>()
  const usedProducts = new Set<string>()
  
  // Add links for each unique keyword
  for (let i = 0; i < content.root.children.length && linksAdded < MAX_INLINE_LINKS; i++) {
    const node = content.root.children[i]
    
    if (node.type !== 'paragraph' || !node.children) continue
    
    for (let j = 0; j < node.children.length && linksAdded < MAX_INLINE_LINKS; j++) {
      const child = node.children[j]
      
      if (child.type !== 'text' || !child.text) continue
      
      for (const kw of validKeywords) {
        // Skip if we already linked this keyword
        if (usedKeywords.has(kw.keyword)) continue
        if (usedProducts.has(kw.product.id)) continue
        if (linksAdded >= MAX_INLINE_LINKS) break
        
        const pos = child.text.indexOf(kw.keyword)
        if (pos === -1) continue
        
        // Split text and insert link
        const before = child.text.substring(0, pos)
        const linkText = child.text.substring(pos, pos + kw.keyword.length)
        const after = child.text.substring(pos + kw.keyword.length)
        
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
            url: extractAffiliateUrl(kw.product.affiliate_url),
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
        
        // Replace text node with new nodes
        node.children.splice(j, 1, ...newNodes)
        
        linksAdded++
        usedKeywords.add(kw.keyword)
        usedProducts.add(kw.product.id)
        console.log(`  ✅ Link ${linksAdded}: "${kw.keyword}" → ${kw.product.product_name.substring(0, 40)}...`)
        
        // Adjust index
        j += newNodes.length - 1
        break
      }
    }
  }
  
  console.log(`\n✅ Added ${linksAdded} unique affiliate links (one per keyword)`)
  
  // Save
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: content
    }
  })
  
  console.log('💾 Saved updated content')
  console.log('\n🌐 View at: http://localhost:3000/posts/' + post.slug)
  
  process.exit(0)
}

main().catch(console.error)