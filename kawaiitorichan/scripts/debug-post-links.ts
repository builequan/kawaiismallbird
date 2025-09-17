#!/usr/bin/env tsx
/**
 * Debug post internal links to check for duplicate targets
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugPostLinks() {
  console.log('🔍 Debugging post internal links...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Fetch posts with internal links
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 10,
      where: {
        _status: {
          equals: 'published'
        }
      },
      depth: 2, // Need depth to populate internal link relationships
    })
    
    for (const post of posts) {
      // Extract all internal links from content
      const links: Array<{ anchorText: string; targetId: any; targetSlug: string }> = []
      
      function extractLinks(node: any, depth: number = 0) {
        if (!node || typeof node !== 'object') return
        
        // Check if this is a link node
        if (node.type === 'link' && node.fields?.linkType === 'internal' && node.fields?.doc) {
          const anchorText = node.children?.[0]?.text || 'unknown'
          const targetDoc = node.fields.doc
          
          if (targetDoc) {
            // Extract the actual ID from various possible structures
            let targetId = targetDoc.value || targetDoc.id || targetDoc
            if (typeof targetId === 'object' && targetId.id) {
              targetId = targetId.id
            }
            
            // Get slug if it's a populated document
            let targetSlug = 'unknown'
            if (typeof targetDoc === 'object' && targetDoc.slug) {
              targetSlug = targetDoc.slug
            } else if (typeof targetDoc.value === 'object' && targetDoc.value.slug) {
              targetSlug = targetDoc.value.slug
            }
            
            links.push({
              anchorText,
              targetId: String(targetId),
              targetSlug
            })
          }
        }
        
        // Recursively search children
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            extractLinks(child, depth + 1)
          }
        }
        
        // Check root
        if (node.root) {
          extractLinks(node.root, depth + 1)
        }
      }
      
      extractLinks(post.content)
      
      if (links.length > 0) {
        console.log(`\n📄 Post: ${post.title} (ID: ${post.id})`)
        console.log(`   Total links: ${links.length}`)
        
        // Group by target to find duplicates
        const linksByTarget = new Map<string, Array<string>>()
        
        for (const link of links) {
          const targetKey = String(link.targetId)
          if (!linksByTarget.has(targetKey)) {
            linksByTarget.set(targetKey, [])
          }
          linksByTarget.get(targetKey)!.push(link.anchorText)
        }
        
        // Check for duplicate targets
        let hasDuplicates = false
        for (const [targetId, anchors] of linksByTarget) {
          if (anchors.length > 1) {
            hasDuplicates = true
            console.log(`   ⚠️  DUPLICATE TARGET: Post ${targetId}`)
            for (const anchor of anchors) {
              console.log(`      - "${anchor}"`)
            }
          }
        }
        
        if (!hasDuplicates) {
          console.log(`   ✅ No duplicate targets - each link points to different article`)
        }
        
        // Show all links
        console.log(`   Links detail:`)
        for (const link of links) {
          console.log(`      "${link.anchorText}" → Post ${link.targetId}`)
        }
      }
    }
    
  } catch (error) {
    console.error('Error debugging links:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

debugPostLinks()