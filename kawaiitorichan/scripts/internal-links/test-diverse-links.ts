#!/usr/bin/env tsx
/**
 * Test diverse linking on a few posts
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testDiverseLinks() {
  console.log('🧪 Testing diverse internal links...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // First apply the existing diverse linking script
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    console.log('Running diverse linking script on 3 posts...')
    await execAsync('PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/internal-links/fix-diverse-linking.ts --limit=3', {
      cwd: process.cwd()
    })
    
    console.log('\nChecking results...')
    
    // Now check the results
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 3,
      depth: 2,
    })
    
    for (const post of posts) {
      console.log(`\n📄 ${post.title} (ID: ${post.id})`)
      
      const links: Array<{ text: string; targetId: string }> = []
      
      function extractLinks(node: any) {
        if (node?.type === 'link' && node?.fields?.linkType === 'internal') {
          const target = node.fields.doc?.value || node.fields.doc
          links.push({
            text: node.children?.[0]?.text || 'unknown',
            targetId: String(target)
          })
        }
        if (node?.children) {
          node.children.forEach(extractLinks)
        }
        if (node?.root) {
          extractLinks(node.root)
        }
      }
      
      extractLinks(post.content)
      
      // Group by target
      const targets: Record<string, string[]> = {}
      links.forEach(link => {
        if (!targets[link.targetId]) {
          targets[link.targetId] = []
        }
        targets[link.targetId].push(link.text)
      })
      
      console.log(`  Total links: ${links.length}`)
      
      let hasDuplicates = false
      for (const [id, texts] of Object.entries(targets)) {
        if (texts.length > 1) {
          console.log(`  ⚠️ DUPLICATE TARGET ${id}: ${texts.join(', ')}`)
          hasDuplicates = true
        }
      }
      
      if (!hasDuplicates && links.length > 0) {
        console.log(`  ✅ All links point to different articles!`)
        links.forEach(link => {
          console.log(`    • "${link.text}" → Post ${link.targetId}`)
        })
      } else if (links.length === 0) {
        console.log(`  ℹ️ No links found`)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

testDiverseLinks()