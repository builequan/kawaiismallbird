#!/usr/bin/env tsx
/**
 * Add styled product recommendation boxes to articles
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
  
  console.log('🎨 Adding Styled Product Recommendation Box\n')
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
    console.log('Post not found')
    process.exit(1)
  }
  
  console.log(`📄 Article: ${post.title}\n`)
  
  // First, clean existing showcase sections
  console.log('Step 1: Cleaning existing product sections...')
  
  const content = JSON.parse(JSON.stringify(post.content))
  
  // Remove existing showcase
  const cleanedChildren = []
  let skipCount = 0
  
  for (let i = 0; i < content.root.children.length; i++) {
    if (skipCount > 0) {
      skipCount--
      continue
    }
    
    const node = content.root.children[i]
    
    if (node.type === 'heading' && node.children) {
      const text = node.children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text || '')
        .join('')
      
      if (text.includes('おすすめ商品')) {
        skipCount = 10
        continue
      }
    }
    
    if (node.type === 'paragraph' && node.children) {
      const text = node.children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text || '')
        .join('')
      
      if (text.startsWith('▶') || text.startsWith('価格:') || text === '関連商品のご紹介') {
        continue
      }
    }
    
    cleanedChildren.push(node)
  }
  
  content.root.children = cleanedChildren
  console.log('✅ Cleaned existing sections\n')
  
  // Step 2: Find best product to showcase
  console.log('Step 2: Selecting best product for showcase box...')
  
  // Find golf-related products
  const golfProducts = products.filter(p => {
    const allText = [
      p.product_name,
      p.keyword_research,
      ...p.keywords
    ].join(' ').toLowerCase()
    
    return allText.includes('ゴルフ') || 
           allText.includes('スイング') || 
           allText.includes('クラブ') ||
           allText.includes('パター')
  })
  
  // Select a popular product
  const showcaseProduct = golfProducts.find(p => 
    p.product_name.includes('今平') || 
    p.product_name.includes('推薦') ||
    p.product_name.includes('人気')
  ) || golfProducts[0]
  
  if (!showcaseProduct) {
    console.log('No suitable product found')
    process.exit(1)
  }
  
  console.log(`Selected: ${showcaseProduct.product_name.substring(0, 50)}...`)
  console.log(`Price: ${showcaseProduct.price}\n`)
  
  // Step 3: Create styled product box using block structure
  console.log('Step 3: Creating styled product recommendation box...')
  
  const productUrl = extractAffiliateUrl(showcaseProduct.affiliate_url)
  
  // Create a custom block that will render as a styled box
  const productBox = {
    type: 'block',
    version: 1,
    fields: {
      blockType: 'productRecommendation',
      richText: {
        root: {
          type: 'root',
          children: [
            // Header with icon
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: '🛍️ ',
                  format: 0
                },
                {
                  type: 'text',
                  text: 'おすすめ商品',
                  format: 1 // Bold
                }
              ]
            },
            // Subtitle
            {
              type: 'paragraph',
              children: [{
                type: 'text',
                text: '関連商品のご紹介',
                format: 0
              }]
            },
            // Product name
            {
              type: 'paragraph',
              children: [{
                type: 'link',
                fields: {
                  url: productUrl,
                  newTab: true,
                  rel: 'nofollow sponsored'
                },
                children: [{
                  type: 'text',
                  text: showcaseProduct.product_name,
                  format: 0
                }]
              }]
            },
            // Price with emphasis
            {
              type: 'heading',
              tag: 'h4',
              children: [{
                type: 'text',
                text: showcaseProduct.price,
                format: 1 // Bold
              }]
            },
            // CTA Button (as styled paragraph)
            {
              type: 'paragraph',
              children: [{
                type: 'link',
                fields: {
                  url: productUrl,
                  newTab: true,
                  rel: 'nofollow sponsored'
                },
                children: [{
                  type: 'text',
                  text: '詳細を見る →',
                  format: 1 // Bold
                }]
              }]
            },
            // Footer note
            {
              type: 'paragraph',
              children: [{
                type: 'text',
                text: '※ 価格は変動する場合があります。リンク先でご確認ください。',
                format: 2 // Italic
              }]
            }
          ]
        }
      }
    }
  }
  
  // Alternative: Create a simpler HTML-styled section
  const styledShowcase = [
    // Divider
    {
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        text: '─'.repeat(50),
        format: 0
      }]
    },
    // Box header
    {
      type: 'heading',
      version: 1,
      tag: 'h3',
      children: [
        {
          type: 'text',
          text: '🛍️ ',
          format: 0
        },
        {
          type: 'text',
          text: 'おすすめ商品',
          format: 1
        }
      ]
    },
    // Subtitle
    {
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        text: '関連商品のご紹介',
        format: 2 // Italic
      }]
    },
    // Product card
    {
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: '【',
          format: 0
        },
        {
          type: 'link',
          version: 1,
          fields: {
            url: productUrl,
            newTab: true,
            rel: 'nofollow sponsored'
          },
          children: [{
            type: 'text',
            text: showcaseProduct.product_name,
            format: 0
          }]
        },
        {
          type: 'text',
          text: '】',
          format: 0
        }
      ]
    },
    // Price highlight
    {
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          text: '💰 ',
          format: 0
        },
        {
          type: 'text',
          text: showcaseProduct.price,
          format: 1 // Bold
        },
        {
          type: 'text',
          text: ' (人気#1)',
          format: 0
        }
      ]
    },
    // CTA button-style link
    {
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'link',
        version: 1,
        fields: {
          url: productUrl,
          newTab: true,
          rel: 'nofollow sponsored'
        },
        children: [{
          type: 'text',
          text: '▶ 詳細を見る・購入する',
          format: 1 // Bold
        }]
      }]
    },
    // Note
    {
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        text: '※ 価格は変動する場合があります。リンク先でご確認ください。',
        format: 2 // Italic
      }]
    },
    // Divider
    {
      type: 'paragraph',
      version: 1,
      children: [{
        type: 'text',
        text: '─'.repeat(50),
        format: 0
      }]
    }
  ]
  
  // Add the styled showcase to content
  content.root.children.push(...styledShowcase)
  
  console.log('✅ Created styled product box\n')
  
  // Step 4: Save
  console.log('Step 4: Saving changes...')
  
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: content
    }
  })
  
  console.log('\n' + '=' .repeat(70))
  console.log('✅ SUCCESS - Styled Product Box Added!')
  console.log('=' .repeat(70))
  console.log(`📄 Article: ${post.title}`)
  console.log(`📦 Featured Product: ${showcaseProduct.product_name.substring(0, 50)}...`)
  console.log(`💰 Price: ${showcaseProduct.price}`)
  console.log('\n🌐 View at: http://localhost:3000/posts/' + post.slug)
  console.log('=' .repeat(70))
  
  process.exit(0)
}

main().catch(console.error)