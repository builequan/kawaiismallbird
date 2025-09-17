#!/usr/bin/env tsx
/**
 * Debug script to test link update
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugLinkUpdate() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get a test post
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 1,
      where: { 
        title: { contains: '初回ゴルフレッスン' } 
      }
    })
    
    if (docs.length === 0) {
      console.log('No post found')
      process.exit(1)
    }
    
    const post = docs[0]
    console.log('Testing with post:', post.title)
    console.log('Post ID:', post.id)
    
    // Clone the content
    const newContent = JSON.parse(JSON.stringify(post.content))
    
    // Find first paragraph with text
    let modified = false
    if (newContent?.root?.children) {
      for (const node of newContent.root.children) {
        if (node.type === 'paragraph' && node.children?.length > 0) {
          const firstChild = node.children[0]
          if (firstChild.type === 'text' && firstChild.text) {
            // Try to add a simple link
            const testLink = {
              type: 'link',
              children: [
                {
                  type: 'text',
                  text: 'test link',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                }
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 2,
              fields: {
                linkType: 'internal',
                doc: {
                  value: post.id, // Link to itself for testing
                  relationTo: 'posts'
                },
                newTab: false,
                url: null
              }
            }
            
            // Insert the link at the beginning
            node.children.unshift(testLink)
            modified = true
            console.log('Added test link to paragraph')
            break
          }
        }
      }
    }
    
    if (!modified) {
      console.log('Could not modify content')
      process.exit(1)
    }
    
    console.log('\nAttempting to update post...')
    
    // Try to update
    const updated = await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        content: newContent,
      },
    })
    
    console.log('✓ Update successful!')
    console.log('Updated post:', updated.title)
    
  } catch (error: any) {
    console.error('Error updating post:')
    console.error(error.message)
    if (error.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
    }
    process.exit(1)
  }
  
  process.exit(0)
}

debugLinkUpdate()