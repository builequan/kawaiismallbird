#!/usr/bin/env tsx
/**
 * Quick script to remove ALL internal links from ALL posts
 * Usage: pnpm tsx scripts/internal-links/remove-all-links.ts
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function removeAllInternalLinks() {
  console.log('\n🚨 WARNING: This will remove ALL internal links from ALL posts!')
  console.log('This action cannot be undone.\n')
  
  const answer = await question('Are you sure you want to continue? Type "yes" to confirm: ')
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.')
    rl.close()
    process.exit(0)
  }
  
  rl.close()
  
  console.log('\n📝 Starting to remove all internal links...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: { equals: 'published' }
      }
    })
    
    console.log(`Found ${posts.length} published posts to process...`)
    
    let removedCount = 0
    let noLinksCount = 0
    
    for (const post of posts) {
      if (!post.content?.root?.children) {
        noLinksCount++
        continue
      }
      
      let hasLinks = false
      
      // Process content to remove internal links
      const updatedChildren = post.content.root.children.map((node: any) => {
        if (node.children) {
          const updatedNodeChildren = node.children.map((child: any) => {
            // If it's an internal link, convert it back to text
            if (child.type === 'link' && child.fields?.linkType === 'internal') {
              hasLinks = true
              // Return just the text content
              return {
                type: 'text',
                text: child.children?.[0]?.text || '',
                format: 0
              }
            }
            return child
          })
          
          // Merge adjacent text nodes
          const mergedChildren: any[] = []
          for (const child of updatedNodeChildren) {
            if (child.type === 'text' && mergedChildren.length > 0 && 
                mergedChildren[mergedChildren.length - 1].type === 'text') {
              // Merge with previous text node
              mergedChildren[mergedChildren.length - 1].text += child.text
            } else {
              mergedChildren.push(child)
            }
          }
          
          return {
            ...node,
            children: mergedChildren
          }
        }
        return node
      })
      
      if (hasLinks) {
        // Update the post without internal links
        const updatedContent = {
          root: {
            type: 'root',
            format: post.content.root.format || '',
            indent: post.content.root.indent || 0,
            version: post.content.root.version || 1,
            children: updatedChildren,
            direction: post.content.root.direction || null
          }
        }
        
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: updatedContent,
            internalLinksMetadata: null // Clear metadata
          }
        })
        
        removedCount++
        console.log(`✓ Removed links from: ${post.title}`)
      } else {
        noLinksCount++
        console.log(`- No links found in: ${post.title}`)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ OPERATION COMPLETE!')
    console.log('='.repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   • Links removed from: ${removedCount} posts`)
    console.log(`   • No links found in: ${noLinksCount} posts`)
    console.log(`   • Total processed: ${posts.length} posts`)
    console.log('='.repeat(50) + '\n')
    
  } catch (error) {
    console.error('❌ Error removing internal links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

removeAllInternalLinks().catch(console.error)