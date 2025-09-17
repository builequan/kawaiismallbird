#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  console.log('🧹 Cleaning single post of ALL product boxes...\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get the specific post
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
  
  if (!post.content?.root?.children) {
    console.log('No content found')
    process.exit(1)
  }
  
  const content = JSON.parse(JSON.stringify(post.content))
  const originalCount = content.root.children.length
  
  // Keep only paragraphs and headings that are NOT product-related
  const filtered = []
  
  for (let i = 0; i < content.root.children.length; i++) {
    const node = content.root.children[i]
    let keep = true
    
    // Skip product headings
    if (node.type === 'heading' && node.children?.length > 0) {
      const text = node.children.map((c: any) => c.text || '').join('')
      if (text.includes('おすすめ商品') || text.includes('関連商品') || text.includes('🛍️')) {
        console.log(`  ❌ Removing heading: "${text}"`)
        keep = false
      }
    }
    
    // Skip product paragraphs
    if (node.type === 'paragraph' && node.children?.length > 0) {
      const text = node.children.map((c: any) => c.text || '').join('')
      
      // Check various patterns that indicate product content
      if (text.includes('▶ ') || 
          text.startsWith('価格:') || 
          text.includes('※ 価格は変動する') ||
          text.includes('関連商品のご紹介') ||
          text === '─'.repeat(50) ||
          text.includes('詳細を見る') ||
          (text.includes('円') && text.match(/^\d/))) {
        console.log(`  ❌ Removing paragraph: "${text.substring(0, 50)}..."`)
        keep = false
      }
      
      // Check for affiliate links that look like product listings
      const hasAffiliateLink = node.children.some((c: any) => 
        c.type === 'link' && c.fields?.rel?.includes('sponsored')
      )
      
      // If it has an affiliate link and looks like a product listing, skip it
      if (hasAffiliateLink) {
        // Check if it's a standalone product link (not inline in article text)
        const startsWithArrow = text.startsWith('▶')
        const hasBrackets = text.includes('【') && text.includes('】')
        const isProductListing = startsWithArrow || hasBrackets
        
        if (isProductListing) {
          console.log(`  ❌ Removing product listing: "${text.substring(0, 50)}..."`)
          keep = false
        }
      }
    }
    
    if (keep) {
      filtered.push(node)
    }
  }
  
  content.root.children = filtered
  
  const removedCount = originalCount - filtered.length
  console.log(`\n✅ Removed ${removedCount} nodes`)
  console.log(`📊 Original: ${originalCount} nodes → New: ${filtered.length} nodes`)
  
  // Save the cleaned content
  await payload.update({
    collection: 'posts',
    id: post.id,
    data: {
      content: content
    }
  })
  
  console.log('💾 Saved clean content')
  console.log('\n🌐 View at: http://localhost:3000/posts/' + post.slug)
  
  process.exit(0)
}

main().catch(console.error)