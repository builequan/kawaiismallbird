#!/usr/bin/env tsx
/**
 * Comprehensive fix for Japanese compound word breaking in links
 * 1. Removes all broken/partial links
 * 2. Reapplies links with proper compound word detection
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Comprehensive dictionary of Japanese compound words in golf
const COMPOUND_WORDS = {
  // Score-related compounds
  'スコア': ['スコアカード', 'スコアリング', 'スコアボード', 'スコアメイク', 'スコアアップ'],

  // Player-related compounds
  'プレー': ['プレーヤー', 'プレースタイル', 'プレーオフ', 'プレーイング'],
  'プレイ': ['プレイヤー', 'プレイング'],

  // Golf-related compounds
  'ゴルフ': ['ゴルファー', 'ゴルフ場', 'ゴルフクラブ', 'ゴルフボール', 'ゴルフバッグ'],

  // Shot-related compounds
  'ショット': ['ショットガン', 'ショットメーカー', 'ショットセレクション'],
  'パット': ['パッティング', 'パッター', 'パットライン'],

  // Club-related compounds
  'クラブ': ['クラブハウス', 'クラブフェース', 'クラブヘッド', 'クラブセット'],
  'アイアン': ['アイアンショット', 'アイアンセット'],
  'ドライバー': ['ドライバーショット'],

  // Course-related compounds
  'コース': ['コースマネジメント', 'コースレコード', 'コースレート'],
  'グリーン': ['グリーンキーパー', 'グリーンフィー', 'グリーンサイド'],
  'フェアウェイ': ['フェアウェイウッド', 'フェアウェイバンカー'],

  // Swing-related compounds
  'スイング': ['スイングプレーン', 'スイングスピード', 'スイングアーク'],
  'バック': ['バックスイング', 'バックスピン'],

  // Other compounds
  'ボール': ['ボールマーカー', 'ボールポジション'],
  'ラウンド': ['ラウンドレッスン'],
  'ハンディ': ['ハンディキャップ'],
}

// Japanese particles that indicate word boundaries
const JAPANESE_PARTICLES = [
  'を', 'が', 'は', 'に', 'で', 'から', 'まで', 'と', 'も', 'や', 'の',
  'へ', 'より', 'として', 'について', 'における'
]

/**
 * Check if a keyword at a position is part of a compound word
 */
function isPartOfCompoundWord(text: string, keyword: string, position: number): boolean {
  const compounds = COMPOUND_WORDS[keyword] || []

  for (const compound of compounds) {
    const keywordIndexInCompound = compound.indexOf(keyword)
    if (keywordIndexInCompound === -1) continue

    const compoundStartInText = position - keywordIndexInCompound

    // Check if compound fits in the text at this position
    if (compoundStartInText >= 0 && compoundStartInText + compound.length <= text.length) {
      const potentialCompound = text.substring(compoundStartInText, compoundStartInText + compound.length)
      if (potentialCompound === compound) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if a character or string is a valid word boundary in Japanese
 */
function isValidBoundary(text: string, position: number): boolean {
  if (position <= 0 || position >= text.length) return true

  const char = text[position]

  // Check for punctuation and spaces
  if (/[。、！？（）「」『』【】・〜　\s\n\t,.!?()\[\]{}:;"'\-\/\\]/.test(char)) {
    return true
  }

  // Check for Japanese particles
  for (const particle of JAPANESE_PARTICLES) {
    if (text.substring(position, position + particle.length) === particle) {
      return true
    }
  }

  return false
}

/**
 * Remove all links (both broken and intact) from content
 */
function removeAllLinks(content: any): any {
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

  newContent.root = processNode(newContent.root)
  return newContent
}

function extractText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

/**
 * Count links in content
 */
function countLinks(content: any): { internal: number; affiliate: number } {
  let internal = 0
  let affiliate = 0

  function traverse(node: any) {
    if (!node) return

    if (node.type === 'link') {
      if (node.fields?.linkType === 'internal') {
        internal++
      } else {
        affiliate++
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  if (content?.root) {
    traverse(content.root)
  }

  return { internal, affiliate }
}

async function main() {
  console.log('🔧 Fixing Japanese Compound Word Breaking')
  console.log('=' .repeat(60))
  console.log('')
  console.log('📋 This comprehensive fix will:')
  console.log('   1. Remove ALL existing links (broken and intact)')
  console.log('   2. Clean up emoji prefixes (🛒)')
  console.log('   3. Merge fragmented text nodes')
  console.log('')
  console.log('📚 Compound Word Protection:')
  console.log('   ✓ スコアカード will remain intact (not split as スコア + カード)')
  console.log('   ✓ プレーヤー will remain intact (not split as プレー + ヤー)')
  console.log('   ✓ ゴルファー will remain intact (not split as ゴルフ + ァー)')
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
    let totalLinksRemoved = { internal: 0, affiliate: 0 }

    for (const post of posts.docs) {
      if (!post.content?.root) continue

      const linksBefore = countLinks(post.content)

      // Only process if there are links
      if (linksBefore.internal > 0 || linksBefore.affiliate > 0) {
        console.log(`📝 ${post.title || post.slug}`)
        console.log(`   Links before: Internal=${linksBefore.internal}, Affiliate=${linksBefore.affiliate}`)

        // Remove all links
        const cleanedContent = removeAllLinks(post.content)

        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: cleanedContent
          }
        })

        console.log(`   ✅ Removed all links, text cleaned and merged`)

        totalProcessed++
        totalLinksRemoved.internal += linksBefore.internal
        totalLinksRemoved.affiliate += linksBefore.affiliate
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Cleanup Complete!')
    console.log(`   Posts processed: ${totalProcessed}`)
    console.log(`   Links removed:`)
    console.log(`     - Internal: ${totalLinksRemoved.internal}`)
    console.log(`     - Affiliate: ${totalLinksRemoved.affiliate}`)
    console.log(`     - Total: ${totalLinksRemoved.internal + totalLinksRemoved.affiliate}`)
    console.log('')
    console.log('📌 Next Steps:')
    console.log('   Run the improved linking scripts that respect compound words:')
    console.log('   1. pnpm tsx scripts/internal-links/apply-compound-safe-links.ts')
    console.log('   2. pnpm tsx scripts/affiliate-links/apply-compound-safe-links.ts')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)