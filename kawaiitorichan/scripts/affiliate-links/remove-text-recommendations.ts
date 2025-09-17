#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function removeTextRecommendations() {
  console.log('🧹 Removing text-based product recommendations from all posts\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' }
    },
    limit: 1000
  })
  
  console.log(`Found ${posts.docs.length} posts to clean\n`)
  
  let cleanedCount = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children?.length) continue
    
    console.log(`Checking: ${post.title}`)
    
    const content = JSON.parse(JSON.stringify(post.content))
    let modified = false
    
    // Filter out the recommendation sections
    const filteredChildren = []
    let skipNext = false
    
    for (let i = 0; i < content.root.children.length; i++) {
      const node = content.root.children[i]
      
      // Skip "おすすめ商品" headings
      if (node.type === 'heading' && node.children?.[0]?.text === 'おすすめ商品') {
        modified = true
        skipNext = true // Skip the next few nodes which are product listings
        continue
      }
      
      // Skip product paragraphs (those starting with ▶ or 価格:)
      if (node.type === 'paragraph' && node.children?.[0]?.text) {
        const text = node.children[0].text
        if (text.startsWith('▶') || text.startsWith('価格:')) {
          modified = true
          continue
        }
      }
      
      filteredChildren.push(node)
    }
    
    if (modified) {
      content.root.children = filteredChildren
      
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: content
        }
      })
      
      console.log(`  ✅ Cleaned text recommendations`)
      cleanedCount++
    } else {
      console.log(`  ⏭️  No text recommendations found`)
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ CLEANING COMPLETE!')
  console.log('='.repeat(70))
  console.log(`📊 Statistics:`)
  console.log(`   - Total posts: ${posts.docs.length}`)
  console.log(`   - Cleaned: ${cleanedCount}`)
  console.log(`   - Already clean: ${posts.docs.length - cleanedCount}`)
  console.log('='.repeat(70))
  console.log('\n💡 Note: The styled product recommendation box (green gradient)')
  console.log('   will still appear via the AffiliateLinksEnhanced component.')
  console.log('='.repeat(70))
  
  process.exit(0)
}

removeTextRecommendations().catch(console.error)