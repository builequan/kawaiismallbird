#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

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

async function main() {
  console.log('🔗 Adding more affiliate links to ensure 3+ products\n')
  
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
  console.log(`Loaded ${products.length} products\n`)
  
  const content = JSON.parse(JSON.stringify(post.content))
  
  // Keywords to search for and link
  const keywordsToFind = [
    'スイング',
    'グリップ', 
    'クラブ',
    'ゴルフ',
    'ボール',
    '練習',
    'レッスン',
    'アイアン',
    'ドライバー',
    'パター'
  ]
  
  let linksAdded = 0
  const usedProducts = new Set<string>()
  const MAX_LINKS = 6
  
  // Go through content and add links
  for (let i = 0; i < content.root.children.length && linksAdded < MAX_LINKS; i++) {
    const node = content.root.children[i]
    
    if (node.type !== 'paragraph' || !node.children) continue
    
    for (let j = 0; j < node.children.length && linksAdded < MAX_LINKS; j++) {
      const child = node.children[j]
      
      if (child.type !== 'text' || !child.text) continue
      
      // Check if text already has a link
      if (j > 0 && node.children[j-1]?.type === 'link') continue
      if (j < node.children.length - 1 && node.children[j+1]?.type === 'link') continue
      
      for (const keyword of keywordsToFind) {
        if (linksAdded >= MAX_LINKS) break
        
        const pos = child.text.indexOf(keyword)
        if (pos === -1) continue
        
        // Find a matching product
        const matchingProduct = products.find(p => {
          if (usedProducts.has(p.id)) return false
          
          const allKeywords = [
            p.keyword_research,
            ...p.keywords,
            ...p.anchorPhrases
          ].filter(k => k).join(' ')
          
          return allKeywords.includes(keyword) || 
                 p.product_name.includes(keyword) ||
                 (keyword === 'クラブ' && p.product_name.includes('ウッド')) ||
                 (keyword === 'ゴルフ' && p.product_name.includes('ゴルフ')) ||
                 (keyword === 'ボール' && p.product_name.includes('ボール')) ||
                 (keyword === '練習' && p.product_name.includes('練習'))
        })
        
        if (!matchingProduct) continue
        
        // Split text and insert link
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
        
        // Replace the text node with new nodes
        node.children.splice(j, 1, ...newNodes)
        
        linksAdded++
        usedProducts.add(matchingProduct.id)
        console.log(`  ✅ Link ${linksAdded}: "${keyword}" → ${matchingProduct.product_name.substring(0, 40)}...`)
        
        // Adjust index for the new nodes
        j += newNodes.length - 1
        break
      }
    }
  }
  
  console.log(`\n✅ Added ${linksAdded} affiliate links`)
  
  // Save the updated content
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