#!/usr/bin/env tsx
/**
 * Add inline affiliate links properly throughout article content
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

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
  
  console.log('🔗 Adding Inline Affiliate Links Throughout Article\n')
  console.log('=' .repeat(70))
  
  // Load products
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  const products: ProductIndex[] = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
  
  // Get the Japanese post
  const post = await payload.findByID({
    collection: 'posts',
    id: '424'
  })
  
  if (!post || !post.content?.root?.children) {
    console.log('Post not found or has no content')
    process.exit(1)
  }
  
  console.log(`📄 Article: ${post.title}\n`)
  
  // Find good keywords to link
  const keywordsToLink = [
    { text: 'ゴルフクラブ', product: null },
    { text: 'スイング', product: null },
    { text: 'グリップ', product: null },
    { text: 'ドライバー', product: null },
    { text: 'アイアン', product: null },
    { text: 'パター', product: null },
    { text: '練習', product: null },
    { text: 'レッスン', product: null },
    { text: 'ゴルフボール', product: null },
    { text: 'ティー', product: null }
  ]
  
  // Match keywords with products
  for (const kw of keywordsToLink) {
    for (const product of products) {
      const allKeywords = [
        product.keyword_research,
        ...product.keywords,
        ...product.anchorPhrases
      ].filter(k => k)
      
      if (allKeywords.some(pk => pk.includes(kw.text) || kw.text.includes(pk))) {
        kw.product = product
        break
      }
    }
  }
  
  // Filter keywords that have matching products
  const validKeywords = keywordsToLink.filter(kw => kw.product !== null)
  console.log(`Found ${validKeywords.length} keywords with matching products\n`)
  
  // Process content
  const content = JSON.parse(JSON.stringify(post.content))
  let totalLinksAdded = 0
  const maxLinksPerArticle = 6
  const usedProducts = new Set<string>()
  const linksAdded: Array<{keyword: string, product: string}> = []
  
  // Process each paragraph
  for (let nodeIndex = 0; nodeIndex < content.root.children.length && totalLinksAdded < maxLinksPerArticle; nodeIndex++) {
    const node = content.root.children[nodeIndex]
    
    if (node.type !== 'paragraph' || !node.children) continue
    
    // Process each text node in the paragraph
    for (let childIndex = 0; childIndex < node.children.length && totalLinksAdded < maxLinksPerArticle; childIndex++) {
      const child = node.children[childIndex]
      
      if (child.type !== 'text' || !child.text) continue
      
      // Try to find and link keywords in this text
      for (const kw of validKeywords) {
        if (totalLinksAdded >= maxLinksPerArticle) break
        if (usedProducts.has(kw.product.id)) continue
        
        const text = child.text
        const keyword = kw.text
        const position = text.indexOf(keyword)
        
        if (position !== -1) {
          // Split text and insert link
          const before = text.substring(0, position)
          const linkText = text.substring(position, position + keyword.length)
          const after = text.substring(position + keyword.length)
          
          const url = extractAffiliateUrl(kw.product.affiliate_url)
          
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
              url: url,
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
          node.children.splice(childIndex, 1, ...newNodes)
          
          totalLinksAdded++
          usedProducts.add(kw.product.id)
          linksAdded.push({
            keyword: keyword,
            product: kw.product.product_name.substring(0, 50) + '...'
          })
          
          console.log(`✅ Added link ${totalLinksAdded}: "${keyword}" → ${kw.product.product_name.substring(0, 40)}...`)
          
          // Skip to next paragraph to distribute links
          break
        }
      }
    }
  }
  
  console.log('\n' + '=' .repeat(70))
  console.log('📊 Links Added Summary:')
  console.log('=' .repeat(70))
  
  for (const link of linksAdded) {
    console.log(`• "${link.keyword}" → ${link.product}`)
  }
  
  // Add product showcase at the end
  console.log('\n📦 Adding Product Showcase Section...')
  
  // Remove any existing showcase
  content.root.children = content.root.children.filter((node: any) => {
    if (node.type === 'heading' && node.children) {
      const text = node.children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('')
      return !text.includes('おすすめ商品')
    }
    return true
  })
  
  // Add new showcase
  if (linksAdded.length >= 3) {
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
    
    // Get the products we linked
    const showcaseProducts = Array.from(usedProducts).slice(0, 3).map(id => 
      products.find(p => p.id === id)
    ).filter(p => p)
    
    for (const product of showcaseProducts) {
      if (!product) continue
      
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
    
    console.log(`✅ Added showcase with ${showcaseProducts.length} products`)
  }
  
  // Update the post
  console.log('\n💾 Saving changes...')
  
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: content
    }
  })
  
  console.log('\n' + '=' .repeat(70))
  console.log('✅ SUCCESS!')
  console.log('=' .repeat(70))
  console.log(`📄 Article: ${post.title}`)
  console.log(`🔗 Inline Links Added: ${totalLinksAdded}`)
  console.log(`📦 Total with Showcase: ${totalLinksAdded + 3}`)
  console.log(`\n🌐 View at: http://localhost:3000/posts/${post.slug}`)
  console.log('=' .repeat(70))
  
  process.exit(0)
}

main().catch(console.error)