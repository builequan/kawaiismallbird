#!/usr/bin/env tsx
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

async function main() {
  console.log('🧹 Removing duplicate product boxes...\n')
  
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
  console.log(`📄 Processing: ${post.title}`)
  
  if (!post.content?.root?.children) {
    console.log('No content found')
    process.exit(1)
  }
  
  const content = JSON.parse(JSON.stringify(post.content))
  let removedCount = 0
  
  // Remove all product showcase sections
  const filtered = []
  let skipNext = 0
  
  for (let i = 0; i < content.root.children.length; i++) {
    const node = content.root.children[i]
    
    // Skip nodes that follow a removed showcase heading
    if (skipNext > 0) {
      skipNext--
      console.log(`  - Removing follow-up content`)
      removedCount++
      continue
    }
    
    // Check for showcase headings
    if (node.type === 'heading' && node.children?.length > 0) {
      const text = node.children.map((c: any) => c.text || '').join('')
      
      if (text.includes('おすすめ商品') || text.includes('関連商品')) {
        console.log(`  - Found showcase heading: "${text}"`)
        removedCount++
        
        // Skip the next few nodes (product paragraphs)
        skipNext = 10 // Skip up to 10 following nodes that are likely part of the showcase
        continue
      }
    }
    
    // Check for standalone product paragraphs with specific patterns
    if (node.type === 'paragraph' && node.children?.length > 0) {
      const hasLink = node.children.some((c: any) => 
        c.type === 'link' && c.fields?.rel?.includes('sponsored')
      )
      const text = node.children.map((c: any) => c.text || '').join('')
      
      // Remove paragraphs that look like product entries
      if (hasLink && (text.includes('▶') || text.includes('【') || text.includes('価格:'))) {
        console.log(`  - Removing product paragraph: "${text.substring(0, 50)}..."`)
        removedCount++
        continue
      }
      
      // Remove price-only paragraphs
      if (text.startsWith('価格:') || text.match(/^\d+円$/)) {
        console.log(`  - Removing price paragraph: "${text}"`)
        removedCount++
        continue
      }
      
      // Remove note paragraphs
      if (text.includes('価格は変動する場合があります')) {
        console.log(`  - Removing note paragraph`)
        removedCount++
        continue
      }
    }
    
    filtered.push(node)
  }
  
  content.root.children = filtered
  
  console.log(`\n✅ Removed ${removedCount} duplicate/showcase elements`)
  
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