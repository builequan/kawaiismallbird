#!/usr/bin/env tsx
/**
 * Remove all internal links from posts
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Remove all link nodes from Lexical content
 */
function removeLinksFromContent(content: any): any {
  if (!content || !content.root) {
    return content
  }
  
  // Deep clone the content
  const newContent = JSON.parse(JSON.stringify(content))
  
  // Process each node in the root
  if (newContent.root.children && Array.isArray(newContent.root.children)) {
    for (const node of newContent.root.children) {
      if (node.type === 'paragraph' && node.children && Array.isArray(node.children)) {
        const newChildren: any[] = []
        
        for (const child of node.children) {
          if (child.type === 'link' && child.fields?.linkType === 'internal') {
            // Replace link with its text content
            if (child.children && Array.isArray(child.children)) {
              for (const linkChild of child.children) {
                if (linkChild.type === 'text') {
                  newChildren.push(linkChild)
                }
              }
            }
          } else {
            newChildren.push(child)
          }
        }
        
        // Merge adjacent text nodes
        const mergedChildren: any[] = []
        for (const child of newChildren) {
          if (child.type === 'text' && mergedChildren.length > 0 && 
              mergedChildren[mergedChildren.length - 1].type === 'text') {
            // Merge with previous text node
            mergedChildren[mergedChildren.length - 1].text += child.text
          } else {
            mergedChildren.push(child)
          }
        }
        
        node.children = mergedChildren
      }
    }
  }
  
  return newContent
}

async function removeLinks(options: { postId?: string; postSlug?: string; all?: boolean } = {}) {
  const { postId, postSlug, all = false } = options
  
  console.log('Removing internal links from posts...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    let posts: any[] = []
    
    if (all) {
      // Remove from all posts
      const { docs } = await payload.find({
        collection: 'posts',
        limit: 1000,
        where: {
          _status: { equals: 'published' }
        }
      })
      posts = docs
      console.log(`Processing ${posts.length} posts...`)
    } else if (postId) {
      // Remove from specific post by ID
      const post = await payload.findByID({
        collection: 'posts',
        id: postId,
      })
      posts = [post]
    } else if (postSlug) {
      // Remove from specific post by slug
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: postSlug } },
        limit: 1,
      })
      posts = docs
    } else {
      console.log('Please specify --all, --id, or --slug')
      process.exit(1)
    }
    
    let successCount = 0
    let noLinksCount = 0
    
    for (const post of posts) {
      // Count existing internal links
      let linkCount = 0
      if (post.content?.root?.children) {
        for (const node of post.content.root.children) {
          if (node.children) {
            for (const child of node.children) {
              if (child.type === 'link' && child.fields?.linkType === 'internal') {
                linkCount++
              }
            }
          }
        }
      }
      
      if (linkCount === 0) {
        console.log(`⏭️  No internal links in: ${post.title}`)
        noLinksCount++
        continue
      }
      
      console.log(`🔗 Found ${linkCount} internal links in: ${post.title}`)
      
      // Remove links
      const newContent = removeLinksFromContent(post.content)
      
      // Update the post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: newContent,
          internalLinksMetadata: null, // Clear metadata
        },
      })
      
      console.log(`✓ Removed links from: ${post.title}`)
      successCount++
    }
    
    console.log('\n✅ Link removal complete!')
    console.log(`📊 Results:`)
    console.log(`  - Links removed from: ${successCount} posts`)
    console.log(`  - No links found in: ${noLinksCount} posts`)
    
  } catch (error) {
    console.error('Error removing links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Parse command line arguments
const args = process.argv.slice(2)
let postId: string | undefined
let postSlug: string | undefined
let all = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--all') {
    all = true
  } else if (args[i] === '--id' && args[i + 1]) {
    postId = args[i + 1]
  } else if (args[i] === '--slug' && args[i + 1]) {
    postSlug = args[i + 1]
  }
}

// Usage examples:
// Remove from all posts:
//   pnpm tsx scripts/internal-links/remove-links.ts --all
// Remove from specific post by ID:
//   pnpm tsx scripts/internal-links/remove-links.ts --id 123
// Remove from specific post by slug:
//   pnpm tsx scripts/internal-links/remove-links.ts --slug "my-post-slug"

removeLinks({ postId, postSlug, all })