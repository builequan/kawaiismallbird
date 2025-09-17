#!/usr/bin/env tsx
/**
 * Test affiliate links with keyword matching only (no embeddings)
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function main() {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🧪 Testing keyword matching between products and posts')
    console.log('=' .repeat(50))
    
    // Get some products
    const products = await payload.find({
      collection: 'affiliate-products',
      where: {
        status: {
          equals: 'active',
        },
      },
      limit: 20,
    })
    
    // Get some posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      limit: 10,
    })
    
    console.log(`📦 Testing with ${products.docs.length} products`)
    console.log(`📝 Testing with ${posts.docs.length} posts`)
    
    // Check for keyword matches
    const matches: any[] = []
    
    for (const post of posts.docs) {
      const postText = (post.title + ' ' + (post.content_html || '')).toLowerCase()
      const postMatches: any[] = []
      
      for (const product of products.docs) {
        // Check if keyword appears in post
        if (product.keyword_research) {
          const keyword = product.keyword_research.toLowerCase()
          if (postText.includes(keyword)) {
            postMatches.push({
              product: product.product_name,
              keyword: product.keyword_research,
              price: product.price,
            })
          }
        }
        
        // Check additional keywords
        if (product.keywords && Array.isArray(product.keywords)) {
          for (const kw of product.keywords) {
            if (kw.keyword && postText.includes(kw.keyword.toLowerCase())) {
              if (!postMatches.find(m => m.product === product.product_name)) {
                postMatches.push({
                  product: product.product_name,
                  keyword: kw.keyword,
                  price: product.price,
                })
              }
            }
          }
        }
      }
      
      if (postMatches.length > 0) {
        matches.push({
          post: post.title,
          slug: post.slug,
          matches: postMatches,
        })
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 Keyword Matching Results:')
    console.log('='.repeat(50))
    
    if (matches.length === 0) {
      console.log('❌ No keyword matches found')
      console.log('\nThis might be because:')
      console.log('1. Posts are in English, products are in Japanese')
      console.log('2. Keywords don\'t match post content')
      console.log('3. Need to adjust keyword extraction')
    } else {
      console.log(`✅ Found matches in ${matches.length} posts:`)
      
      matches.forEach((match, index) => {
        console.log(`\n${index + 1}. Post: "${match.post}"`)
        console.log(`   URL: /posts/${match.slug}`)
        console.log(`   Matched products:`)
        match.matches.slice(0, 3).forEach((m: any) => {
          console.log(`   - ${m.product}`)
          console.log(`     Keyword: "${m.keyword}"`)
          console.log(`     Price: ${m.price}`)
        })
        if (match.matches.length > 3) {
          console.log(`   ... and ${match.matches.length - 3} more`)
        }
      })
    }
    
    // Check language distribution
    console.log('\n' + '='.repeat(50))
    console.log('📊 Language Analysis:')
    console.log('='.repeat(50))
    
    const japaneseProducts = products.docs.filter(p => p.language === 'ja').length
    const englishProducts = products.docs.filter(p => p.language === 'en').length
    const bothProducts = products.docs.filter(p => p.language === 'both').length
    
    console.log('Products:')
    console.log(`  Japanese: ${japaneseProducts}`)
    console.log(`  English: ${englishProducts}`)
    console.log(`  Both: ${bothProducts}`)
    
    // Check post language (simple detection)
    let japanesePostCount = 0
    let englishPostCount = 0
    
    for (const post of posts.docs) {
      const text = post.title + ' ' + (post.content_html || '')
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
      if (hasJapanese) {
        japanesePostCount++
      } else {
        englishPostCount++
      }
    }
    
    console.log('\nPosts:')
    console.log(`  Japanese: ${japanesePostCount}`)
    console.log(`  English: ${englishPostCount}`)
    
    if (japaneseProducts > 0 && englishPostCount > 0 && japanesePostCount === 0) {
      console.log('\n⚠️  Language mismatch detected!')
      console.log('Most products are in Japanese but posts are in English.')
      console.log('This will result in few matches.')
    }
    
    // Show some sample keywords
    console.log('\n' + '='.repeat(50))
    console.log('📝 Sample Product Keywords:')
    console.log('='.repeat(50))
    
    products.docs.slice(0, 5).forEach(product => {
      console.log(`\n"${product.product_name}"`)
      console.log(`  Primary: ${product.keyword_research || 'none'}`)
      if (product.keywords && product.keywords.length > 0) {
        const additionalKeywords = product.keywords.map((k: any) => k.keyword).filter(Boolean).join(', ')
        if (additionalKeywords) {
          console.log(`  Additional: ${additionalKeywords}`)
        }
      }
    })
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Keyword test completed!')
    console.log('='.repeat(50))
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)