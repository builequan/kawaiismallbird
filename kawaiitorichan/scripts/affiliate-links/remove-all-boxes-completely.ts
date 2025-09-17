#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function removeAllProductBoxes(content: any): any {
  if (!content?.root?.children) return content
  
  const filtered = []
  let skipCount = 0
  
  for (let i = 0; i < content.root.children.length; i++) {
    const node = content.root.children[i]
    
    // Skip nodes that are part of a product showcase
    if (skipCount > 0) {
      skipCount--
      continue
    }
    
    // Check if this is a product-related heading
    if (node.type === 'heading' && node.children?.length > 0) {
      const text = node.children.map((c: any) => c.text || '').join('')
      if (text.includes('おすすめ商品') || text.includes('関連商品') || text.includes('🛍️')) {
        // Skip this heading and the next several nodes
        skipCount = 15 // Skip more nodes to ensure we get everything
        continue
      }
    }
    
    // Check for product-related paragraphs
    if (node.type === 'paragraph' && node.children?.length > 0) {
      const text = node.children.map((c: any) => c.text || '').join('')
      
      // Skip if it looks like a product entry
      if (text.includes('▶ ') || 
          text.includes('価格:') || 
          text.includes('※ 価格は変動する') ||
          text.includes('関連商品のご紹介') ||
          text === '─'.repeat(50)) {
        continue
      }
      
      // Check if it has an affiliate link with product-like text
      const hasAffiliateLink = node.children.some((c: any) => 
        c.type === 'link' && c.fields?.rel?.includes('sponsored')
      )
      
      if (hasAffiliateLink && (text.includes('【') || text.includes('】'))) {
        continue
      }
    }
    
    filtered.push(node)
  }
  
  return { ...content, root: { ...content.root, children: filtered } }
}

async function main() {
  console.log('🧹 Removing ALL product boxes completely...\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all published posts
  const posts = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' }
    },
    limit: 100
  })
  
  console.log(`Found ${posts.docs.length} posts to clean\n`)
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children?.length) continue
    
    const originalLength = post.content.root.children.length
    const cleanedContent = removeAllProductBoxes(post.content)
    const newLength = cleanedContent.root.children.length
    
    if (originalLength !== newLength) {
      console.log(`📄 ${post.title}`)
      console.log(`   Removed ${originalLength - newLength} nodes`)
      
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: cleanedContent
        }
      })
    }
  }
  
  console.log('\n✅ All product boxes removed from all posts!')
  process.exit(0)
}

main().catch(console.error)