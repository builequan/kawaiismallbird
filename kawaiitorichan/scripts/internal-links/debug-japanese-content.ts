#!/usr/bin/env tsx
/**
 * Debug script to understand Japanese Lexical content structure
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugContent() {
  const payload = await getPayload({ config: configPromise })
  
  // Get Japanese posts with substantial content
  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 10,
    where: {
      _status: { equals: 'published' }
    }
  })
  
  // Find a Japanese post with content
  let targetPost = null
  for (const post of posts) {
    const content = JSON.stringify(post.content || '')
    if (content.includes('ゴルフ') || content.includes('スイング')) {
      targetPost = post
      break
    }
  }
  
  if (!targetPost) {
    console.log('No Japanese posts found')
    process.exit(1)
  }
  
  console.log('Post title:', targetPost.title)
  console.log('Post slug:', targetPost.slug)
  
  // Extract text from Lexical format
  function extractText(node: any): string {
    if (!node) return ''
    
    if (node.type === 'text') {
      return node.text || ''
    }
    
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    
    return ''
  }
  
  console.log('\n=== EXTRACTED TEXT ===')
  const fullText = extractText(targetPost.content?.root)
  console.log(fullText.substring(0, 500))
  
  // Show structure of first few paragraphs
  console.log('\n=== PARAGRAPH STRUCTURE ===')
  if (targetPost.content?.root?.children) {
    targetPost.content.root.children.slice(0, 3).forEach((node: any, idx: number) => {
      if (node.type === 'paragraph') {
        const text = extractText(node)
        console.log(`\nParagraph ${idx}: "${text.substring(0, 100)}..."`)
        
        // Show children
        if (node.children) {
          console.log('  Children:')
          node.children.forEach((child: any, childIdx: number) => {
            console.log(`    [${childIdx}] type: ${child.type}, text: "${extractText(child).substring(0, 50)}"`)
          })
        }
      }
    })
  }
  
  process.exit(0)
}

debugContent().catch(console.error)