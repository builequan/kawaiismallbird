#!/usr/bin/env tsx
/**
 * Debug script to understand Lexical content structure
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugContent() {
  const payload = await getPayload({ config: configPromise })
  
  // Get a sample post
  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 1,
    where: {
      _status: { equals: 'published' }
    }
  })
  
  if (posts.length === 0) {
    console.log('No published posts found')
    process.exit(1)
  }
  
  const post = posts[0]
  console.log('Post title:', post.title)
  console.log('\n=== RAW CONTENT ===')
  console.log(JSON.stringify(post.content, null, 2))
  
  console.log('\n=== PARAGRAPH NODES ===')
  if (post.content?.root?.children) {
    post.content.root.children.forEach((node: any, idx: number) => {
      if (node.type === 'paragraph' && node.children) {
        console.log(`\nParagraph ${idx}:`)
        node.children.forEach((child: any, childIdx: number) => {
          if (child.type === 'text') {
            console.log(`  Text ${childIdx}: "${child.text}"`)
          } else if (child.type === 'link') {
            const linkText = child.children?.map((c: any) => c.text || '').join('') || ''
            console.log(`  Link ${childIdx}: "${linkText}"`)
          }
        })
      }
    })
  }
  
  process.exit(0)
}

debugContent().catch(console.error)