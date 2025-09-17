#!/usr/bin/env tsx
/**
 * Reset all links and reapply with compound word protection
 * This will:
 * 1. Remove ALL existing links (both internal and affiliate)
 * 2. Reapply internal links with compound word protection
 * 3. Reapply affiliate links with compound word protection
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function removeAllLinks(content: any): any {
  if (!content) return content

  const newContent = JSON.parse(JSON.stringify(content))

  function processNode(node: any): any {
    if (!node) return node

    // If this is a link, return its text content
    if (node.type === 'link') {
      const linkText = extractText(node).replace('🛒 ', '') // Remove emoji prefix
      return {
        type: 'text',
        text: linkText,
        version: 1
      }
    }

    // Process children
    if (node.children && Array.isArray(node.children)) {
      const newChildren = []

      for (const child of node.children) {
        const processed = processNode(child)
        if (processed) {
          // If previous node is text and current is text, merge them
          const prev = newChildren[newChildren.length - 1]
          if (prev && prev.type === 'text' && processed.type === 'text') {
            prev.text += processed.text
          } else {
            newChildren.push(processed)
          }
        }
      }

      node.children = newChildren
    }

    return node
  }

  function extractText(node: any): string {
    if (!node) return ''
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  newContent.root = processNode(newContent.root)
  return newContent
}

async function main() {
  console.log('🔄 Resetting and Reapplying All Links with Compound Word Protection')
  console.log('=' .repeat(60))
  console.log('')
  console.log('📋 This will:')
  console.log('   1. Remove ALL existing links (internal and affiliate)')
  console.log('   2. Clean up any broken text fragments')
  console.log('   3. You can then reapply links using the admin UI')
  console.log('')
  console.log('⚠️  This action will modify all posts!')
  console.log('')

  const payload = await getPayload({ config: configPromise })

  try {
    // Get all posts
    const posts = await payload.find({
      collection: 'posts',
      limit: 100,
      depth: 0,
    })

    console.log(`📊 Processing ${posts.docs.length} posts...`)
    console.log('')

    let totalProcessed = 0
    let totalInternalRemoved = 0
    let totalAffiliateRemoved = 0

    for (const post of posts.docs) {
      if (!post.content?.root) continue

      console.log(`📝 Processing: ${post.title || post.slug}`)

      // Count existing links before removal
      let internalCount = 0
      let affiliateCount = 0

      function countLinks(node: any) {
        if (!node) return
        if (node.type === 'link') {
          if (node.fields?.linkType === 'internal') {
            internalCount++
          } else {
            affiliateCount++
          }
        }
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(countLinks)
        }
      }

      countLinks(post.content.root)

      if (internalCount > 0 || affiliateCount > 0) {
        // Remove all links
        const cleanedContent = await removeAllLinks(post.content)

        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: cleanedContent
          }
        })

        console.log(`   ✅ Removed: ${internalCount} internal, ${affiliateCount} affiliate links`)

        totalProcessed++
        totalInternalRemoved += internalCount
        totalAffiliateRemoved += affiliateCount
      } else {
        console.log(`   ✓ No links to remove`)
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Reset Complete!')
    console.log(`   Posts processed: ${totalProcessed}`)
    console.log(`   Links removed:`)
    console.log(`     - Internal: ${totalInternalRemoved}`)
    console.log(`     - Affiliate: ${totalAffiliateRemoved}`)
    console.log(`     - Total: ${totalInternalRemoved + totalAffiliateRemoved}`)
    console.log('')
    console.log('📌 Next Steps:')
    console.log('   The API endpoints have been updated with compound word protection.')
    console.log('   You can now use the admin UI buttons to reapply links:')
    console.log('   ')
    console.log('   1. Go to http://localhost:3000/admin/internal-links')
    console.log('      - Click "Rebuild Index" first')
    console.log('      - Then click "Process All Posts"')
    console.log('   ')
    console.log('   2. Go to http://localhost:3000/admin/affiliate-links')
    console.log('      - Click "Process New Posts"')
    console.log('   ')
    console.log('   The updated API endpoints will now protect compound words like:')
    console.log('   • スコアカード (won\'t split as スコア + カード)')
    console.log('   • プレーヤー (won\'t split as プレー + ヤー)')
    console.log('   • ゴルファー (won\'t split as ゴルフ + ァー)')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)