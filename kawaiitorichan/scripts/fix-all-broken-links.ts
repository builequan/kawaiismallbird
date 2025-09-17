#!/usr/bin/env tsx
/**
 * Fix all broken word links by removing them and reapplying correctly
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface LinkRemovalStats {
  postsProcessed: number
  linksRemoved: number
  affiliateLinksRemoved: number
  internalLinksRemoved: number
}

/**
 * Check if text is a broken word fragment
 */
function isBrokenWord(text: string, context?: { before?: string; after?: string }): boolean {
  // Too short to be meaningful (except for some valid short words)
  const validShortWords = ['球', '打', '勝', '負', '上', '下', '左', '右']
  if (text.length <= 2 && !validShortWords.includes(text)) {
    // Single or double character that's likely a fragment
    if (/^[ァ-ヴ]{1,2}$/.test(text)) return true
    if (/^[ぁ-ん]{1,2}$/.test(text)) return true
  }

  // Check if surrounded by Japanese characters (likely broken)
  if (context) {
    const { before = '', after = '' } = context
    // If both before and after are Japanese characters, it's likely broken
    if (/[ぁ-んァ-ヴ一-龯]/.test(before) && /[ぁ-んァ-ヴ一-龯]/.test(after)) {
      return true
    }
    // Specific patterns that indicate broken words
    if (before && /[ァ-ヴ]$/.test(before) && /^[ァ-ヴ]/.test(text)) {
      return true // Katakana continuation
    }
  }

  // Known fragments from the diagnostic
  const fragments = [
    'パラ', // Should be パラレル or パラメーター
    'ヤー', // Fragment from プレーヤー
    'スコア', // Often should be スコアカード
    'プレー', // Often should be プレーヤー
  ]

  // Check if it's a known fragment that needs context
  if (fragments.includes(text) && context) {
    const { before = '', after = '' } = context
    // These need specific context to be valid
    if (text === 'スコア' && after === 'カ') return true // Should be スコアカード
    if (text === 'プレー' && after === 'ヤ') return true // Should be プレーヤー
  }

  // Check for emoji prefixes (clearly artificial)
  if (text.startsWith('🛒')) return true

  return false
}

/**
 * Remove broken links from content
 */
function removeBrokenLinks(content: any): { content: any; stats: LinkRemovalStats } {
  const stats: LinkRemovalStats = {
    postsProcessed: 0,
    linksRemoved: 0,
    affiliateLinksRemoved: 0,
    internalLinksRemoved: 0
  }

  if (!content || !content.root) {
    return { content, stats }
  }

  const newContent = JSON.parse(JSON.stringify(content))

  function processNode(node: any, parent?: any, parentIndex?: number): any {
    if (!node) return node

    // If this is a link node, check if it should be removed
    if (node.type === 'link') {
      const anchorText = extractText(node)

      // Get context from parent if available
      let before = ''
      let after = ''

      if (parent && parent.children && parentIndex !== undefined) {
        // Get text before this link
        if (parentIndex > 0) {
          const prevNode = parent.children[parentIndex - 1]
          if (prevNode.type === 'text' && prevNode.text) {
            before = prevNode.text[prevNode.text.length - 1] || ''
          }
        }

        // Get text after this link
        if (parentIndex < parent.children.length - 1) {
          const nextNode = parent.children[parentIndex + 1]
          if (nextNode.type === 'text' && nextNode.text) {
            after = nextNode.text[0] || ''
          }
        }
      }

      // Check if this link is broken
      if (isBrokenWord(anchorText, { before, after })) {
        stats.linksRemoved++

        // Track type of link
        if (node.fields?.linkType === 'internal') {
          stats.internalLinksRemoved++
        } else {
          stats.affiliateLinksRemoved++
        }

        // Return just the text content without the link
        return {
          type: 'text',
          text: anchorText.replace('🛒 ', ''), // Remove emoji prefix if present
          version: 1
        }
      }
    }

    // Process children
    if (node.children && Array.isArray(node.children)) {
      const newChildren = []
      for (let i = 0; i < node.children.length; i++) {
        const processed = processNode(node.children[i], node, i)
        if (processed) {
          newChildren.push(processed)
        }
      }

      // Merge adjacent text nodes
      const mergedChildren = []
      for (let i = 0; i < newChildren.length; i++) {
        const current = newChildren[i]
        const prev = mergedChildren[mergedChildren.length - 1]

        if (current.type === 'text' && prev && prev.type === 'text') {
          // Merge with previous text node
          prev.text += current.text
        } else {
          mergedChildren.push(current)
        }
      }

      node.children = mergedChildren
    }

    return node
  }

  newContent.root = processNode(newContent.root)
  stats.postsProcessed = 1

  return { content: newContent, stats }
}

function extractText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

async function main() {
  console.log('🔧 Fixing All Broken Word Links')
  console.log('=' .repeat(60))
  console.log('This will:')
  console.log('1. Remove all links that break words')
  console.log('2. Remove emoji prefixes (🛒)')
  console.log('3. Merge text nodes properly')
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

    const totalStats: LinkRemovalStats = {
      postsProcessed: 0,
      linksRemoved: 0,
      affiliateLinksRemoved: 0,
      internalLinksRemoved: 0
    }

    for (const post of posts.docs) {
      if (!post.content?.root) continue

      console.log(`📝 Processing: ${post.title || post.slug}`)

      const { content: cleanedContent, stats } = removeBrokenLinks(post.content)

      if (stats.linksRemoved > 0) {
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: cleanedContent
          }
        })

        console.log(`   ✅ Removed ${stats.linksRemoved} broken links`)
        console.log(`      - Internal: ${stats.internalLinksRemoved}`)
        console.log(`      - Affiliate: ${stats.affiliateLinksRemoved}`)

        totalStats.postsProcessed++
        totalStats.linksRemoved += stats.linksRemoved
        totalStats.internalLinksRemoved += stats.internalLinksRemoved
        totalStats.affiliateLinksRemoved += stats.affiliateLinksRemoved
      } else {
        console.log(`   ✓ No broken links found`)
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Fix Complete!')
    console.log(`   Posts processed: ${totalStats.postsProcessed}`)
    console.log(`   Total links removed: ${totalStats.linksRemoved}`)
    console.log(`   - Internal links: ${totalStats.internalLinksRemoved}`)
    console.log(`   - Affiliate links: ${totalStats.affiliateLinksRemoved}`)
    console.log('')
    console.log('📌 Next Steps:')
    console.log('1. Run internal link script with proper word boundaries:')
    console.log('   pnpm tsx scripts/internal-links/apply-proper-links.ts')
    console.log('2. Run affiliate link script with proper word boundaries:')
    console.log('   pnpm tsx scripts/affiliate-links/apply-proper-links.ts')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)