#!/usr/bin/env tsx

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function simpleRemoveAllLinks() {
  console.log('🔗 Starting to remove all internal links...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: { equals: 'published' }
      },
      depth: 0
    })
    
    console.log(`Found ${posts.length} posts to process...`)
    
    let removedCount = 0
    let noLinksCount = 0
    let errorCount = 0
    
    for (const post of posts) {
      try {
        if (!post.content?.root?.children) {
          noLinksCount++
          continue
        }
        
        let hasLinks = false
        
        // Process content to remove internal links
        const updatedChildren = post.content.root.children.map((node: any) => {
          if (!node.children) return node
          
          const updatedNodeChildren: any[] = []
          
          for (const child of node.children) {
            // If it's an internal link, extract just the text
            if (child.type === 'link' && child.fields?.linkType === 'internal') {
              hasLinks = true
              // Add the text content directly
              if (child.children?.[0]?.text) {
                updatedNodeChildren.push({
                  type: 'text',
                  text: child.children[0].text,
                  format: child.children[0].format || 0,
                  version: 1
                })
              }
            } else {
              updatedNodeChildren.push(child)
            }
          }
          
          // Merge consecutive text nodes
          const mergedChildren: any[] = []
          for (let i = 0; i < updatedNodeChildren.length; i++) {
            const current = updatedNodeChildren[i]
            if (current.type === 'text' && i > 0 && mergedChildren[mergedChildren.length - 1].type === 'text') {
              // Merge with previous text node
              mergedChildren[mergedChildren.length - 1].text += current.text
            } else {
              mergedChildren.push(current)
            }
          }
          
          return {
            ...node,
            children: mergedChildren
          }
        })
        
        if (hasLinks) {
          // Get the full post first to preserve other fields
          const fullPost = await payload.findByID({
            collection: 'posts',
            id: post.id,
            depth: 1
          })
          
          // Update only the content field
          const updateData: any = {
            ...fullPost,
            content: {
              root: {
                type: 'root',
                format: post.content.root.format || '',
                indent: post.content.root.indent || 0,
                version: post.content.root.version || 1,
                children: updatedChildren,
                direction: post.content.root.direction || null
              }
            }
          }
          
          // Remove fields that shouldn't be in the update
          delete updateData.id
          delete updateData.createdAt
          delete updateData.updatedAt
          delete updateData.sizes
          
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: updateData
          })
          
          removedCount++
          console.log(`✓ Removed links from: ${post.title}`)
        } else {
          noLinksCount++
        }
      } catch (err) {
        console.error(`❌ Error processing post "${post.title}":`, err)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ OPERATION COMPLETE!')
    console.log('='.repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   • Links removed from: ${removedCount} posts`)
    console.log(`   • No links found in: ${noLinksCount} posts`)
    console.log(`   • Errors: ${errorCount} posts`)
    console.log(`   • Total processed: ${posts.length} posts`)
    console.log('='.repeat(50) + '\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

simpleRemoveAllLinks().catch(console.error)