#!/usr/bin/env tsx
/**
 * Apply internal links with Japanese compound word protection
 * This script ensures compound words like スコアカード, プレーヤー, ゴルファー remain intact
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'

// Comprehensive dictionary of Japanese compound words in golf
const COMPOUND_WORDS: { [key: string]: string[] } = {
  'スコア': ['スコアカード', 'スコアリング', 'スコアボード', 'スコアメイク', 'スコアアップ'],
  'プレー': ['プレーヤー', 'プレースタイル', 'プレーオフ', 'プレーイング'],
  'ゴルフ': ['ゴルファー', 'ゴルフ場', 'ゴルフクラブ', 'ゴルフボール', 'ゴルフバッグ', 'ゴルフコース'],
  'ショット': ['ショットガン', 'ショットメーカー', 'ショットセレクション'],
  'パット': ['パッティング', 'パッター', 'パットライン'],
  'クラブ': ['クラブハウス', 'クラブフェース', 'クラブヘッド', 'クラブセット'],
  'アイアン': ['アイアンショット', 'アイアンセット'],
  'ドライバー': ['ドライバーショット'],
  'コース': ['コースマネジメント', 'コースレコード', 'コースレート', 'コースコンディション'],
  'グリーン': ['グリーンキーパー', 'グリーンフィー', 'グリーンサイド', 'グリーンスピード'],
  'フェアウェイ': ['フェアウェイウッド', 'フェアウェイバンカー'],
  'スイング': ['スイングプレーン', 'スイングスピード', 'スイングアーク', 'スイングテンポ'],
  'バック': ['バックスイング', 'バックスピン', 'バックティー'],
  'ボール': ['ボールマーカー', 'ボールポジション', 'ボールフライト'],
  'ラウンド': ['ラウンドレッスン'],
  'ハンディ': ['ハンディキャップ'],
  'ティー': ['ティーショット', 'ティーグラウンド', 'ティーアップ'],
  'アプローチ': ['アプローチショット', 'アプローチウェッジ'],
  'フォロー': ['フォロースルー'],
}

// Japanese particles and punctuation that indicate word boundaries
const WORD_BOUNDARIES = [
  // Particles
  'を', 'が', 'は', 'に', 'で', 'から', 'まで', 'と', 'も', 'や', 'の', 'へ', 'より',
  // Punctuation
  '。', '、', '！', '？', '（', '）', '「', '」', '『', '』', '【', '】', '・', '〜',
  // Spaces and special characters
  '　', ' ', '\n', '\t', ',', '.', '!', '?', '(', ')', '[', ']', '{', '}', ':', ';'
]

interface PostIndex {
  id: string
  slug: string
  title: string
  anchorPhrases: string[]
}

interface SimilarityData {
  similarities: {
    [postId: string]: {
      slug: string
      similar: Array<{
        id: string
        slug: string
        score: number
      }>
    }
  }
}

// Global tracking to prevent bidirectional links
const establishedLinks = new Map<string, Set<string>>()

function recordLink(fromId: string, toId: string) {
  if (!establishedLinks.has(fromId)) {
    establishedLinks.set(fromId, new Set())
  }
  establishedLinks.get(fromId)!.add(toId)
}

function isLinkAllowed(fromId: string, toId: string): boolean {
  const reverseLinks = establishedLinks.get(toId)
  return !(reverseLinks && reverseLinks.has(fromId))
}

/**
 * Check if a keyword at a position is part of a compound word
 */
function isPartOfCompoundWord(text: string, keyword: string, position: number): boolean {
  const compounds = COMPOUND_WORDS[keyword] || []

  for (const compound of compounds) {
    const keywordIndexInCompound = compound.indexOf(keyword)
    if (keywordIndexInCompound === -1) continue

    const compoundStartInText = position - keywordIndexInCompound

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
 * Check if position has a valid word boundary
 */
function hasWordBoundary(text: string, position: number): boolean {
  if (position <= 0 || position >= text.length) return true

  const char = text[position]

  for (const boundary of WORD_BOUNDARIES) {
    if (text.substring(position, position + boundary.length) === boundary) {
      return true
    }
  }

  return false
}

/**
 * Universal metadata filter patterns
 */
const METADATA_PATTERNS = [
  // UI/Structure elements
  'ヒーロー画像', 'アイキャッチ', 'サムネイル', 'イメージ画像',
  '出典', '参考文献', 'リンク:', '画像:', 'ソース:',
  'コメント', 'シェア', 'いいね', 'フォロー',

  // Navigation/UI
  '次へ', '前へ', 'トップ', 'ホーム', 'メニュー', 'ページ',
  'クリック', 'タップ', 'スクロール', 'ズーム',

  // Time/Date patterns
  /^\d{4}年\d{1,2}月/, /^\d{1,2}月\d{1,2}日/, /^今週/, /^先週/, /^来週/,

  // Common unrelated terms (any domain)
  /^(州|市|町|村)(議会|長|役所|政府)/, // Political terms
  /^(動画|ビデオ|写真|図|表|グラフ|チャート)/, // Media/visualization labels
  /^\[.*\]/, // Bracketed content (often metadata)

  // Reference/citation patterns
  /リンク$/, /ページ$/, /サイト$/,
]

/**
 * Check if a phrase is metadata/structural content
 */
function isMetadataPhrase(phrase: string): boolean {
  return METADATA_PATTERNS.some(pattern =>
    typeof pattern === 'string'
      ? phrase.includes(pattern)
      : pattern.test(phrase)
  )
}

/**
 * Find valid anchor phrases in text that respect compound words (UNIVERSAL VERSION)
 */
function findValidAnchorPhrases(text: string, targetPost: PostIndex): Array<{phrase: string; position: number}> {
  const validPhrases: Array<{phrase: string; position: number}> = []

  // Check target's anchor phrases
  for (const phrase of targetPost.anchorPhrases) {
    // Skip too short phrases
    if (phrase.length < 3) continue

    // Skip metadata/UI phrases
    if (isMetadataPhrase(phrase)) continue

    // Skip overly generic single character particles
    if (phrase === 'の' || phrase === 'で' || phrase === 'と') continue

    let position = text.indexOf(phrase)
    while (position !== -1) {
      // Check if this phrase is part of a compound word
      if (!isPartOfCompoundWord(text, phrase, position)) {
        // Check word boundaries
        const beforeOk = hasWordBoundary(text, position)
        const afterOk = hasWordBoundary(text, position + phrase.length)

        if (beforeOk && afterOk) {
          validPhrases.push({ phrase, position })
          break // Only one link per phrase
        }
      }

      position = text.indexOf(phrase, position + 1)
    }
  }

  // If not enough phrases found, look for meaningful terms from title
  if (validPhrases.length < 3) {
    // Extract keywords from target post title
    const titleWords = targetPost.title.match(/[ァ-ヶー一-龠]{3,}/g) || []

    for (const word of titleWords) {
      if (text.includes(word) && !isMetadataPhrase(word) && word.length >= 3) {
        let position = text.indexOf(word)
        while (position !== -1) {
          if (!isPartOfCompoundWord(text, word, position)) {
            const beforeOk = hasWordBoundary(text, position)
            const afterOk = hasWordBoundary(text, position + word.length)

            if (beforeOk && afterOk) {
              validPhrases.push({ phrase: word, position })
              break
            }
          }

          position = text.indexOf(word, position + 1)
        }
      }
    }
  }

  return validPhrases
}

function createLinkNode(targetId: string | number, anchorText: string): any {
  return {
    type: 'link',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: anchorText,
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
        value: targetId,
        relationTo: 'posts'
      },
      newTab: false,
      url: null
    }
  }
}

function extractText(node: any): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }
  return ''
}

function applyInternalLinks(
  content: any,
  targetPosts: Array<{post: PostIndex; phrases: Array<{phrase: string; position: number}>}>,
  maxLinks: number = 5
): { content: any; linksAdded: number } {
  if (!content?.root || targetPosts.length === 0) {
    return { content, linksAdded: 0 }
  }

  const newContent = JSON.parse(JSON.stringify(content))
  let linksAdded = 0
  const usedPhrases = new Set<string>()

  // Sort target posts by first phrase position to distribute links
  const sortedTargets = targetPosts
    .filter(t => t.phrases.length > 0)
    .sort((a, b) => a.phrases[0].position - b.phrases[0].position)
    .slice(0, maxLinks)

  // Process paragraphs
  if (newContent.root.children && Array.isArray(newContent.root.children)) {
    for (const target of sortedTargets) {
      if (linksAdded >= maxLinks) break

      const phrase = target.phrases[0]
      if (usedPhrases.has(phrase.phrase.toLowerCase())) continue

      // Find the paragraph containing this phrase
      for (let i = 0; i < newContent.root.children.length; i++) {
        const node = newContent.root.children[i]

        if (node.type === 'paragraph' && node.children) {
          const paragraphText = extractText(node)

          if (paragraphText.includes(phrase.phrase)) {
            // Apply link to this paragraph
            const applied = applyLinkToParagraph(node, phrase.phrase, target.post.id)

            if (applied) {
              linksAdded++
              usedPhrases.add(phrase.phrase.toLowerCase())
              console.log(`      ✓ Linked "${phrase.phrase}" → ${target.post.title.substring(0, 40)}...`)
              break
            }
          }
        }
      }
    }
  }

  return { content: newContent, linksAdded }
}

function applyLinkToParagraph(paragraph: any, phrase: string, targetId: string): boolean {
  if (!paragraph.children) return false

  for (let i = 0; i < paragraph.children.length; i++) {
    const child = paragraph.children[i]

    if (child.type === 'text' && child.text && child.text.includes(phrase)) {
      const position = child.text.indexOf(phrase)

      // Double-check compound word safety
      if (!isPartOfCompoundWord(child.text, phrase, position)) {
        const before = child.text.substring(0, position)
        const after = child.text.substring(position + phrase.length)

        const newNodes = []
        if (before) {
          newNodes.push({ ...child, text: before })
        }

        const numericId = typeof targetId === 'string' ? parseInt(targetId) : targetId
        newNodes.push(createLinkNode(numericId, phrase))

        if (after) {
          newNodes.push({ ...child, text: after })
        }

        paragraph.children.splice(i, 1, ...newNodes)
        return true
      }
    }
  }

  return false
}

async function main() {
  console.log('🔗 Applying Internal Links with Compound Word Protection')
  console.log('=' .repeat(60))
  console.log('✅ Features:')
  console.log('   • Protects compound words (スコアカード, プレーヤー, ゴルファー)')
  console.log('   • Respects Japanese word boundaries')
  console.log('   • Maximum 5 links per post')
  console.log('   • No bidirectional linking')
  console.log('   • Minimum 3-character anchor text')
  console.log('')

  const payload = await getPayload({ config: configPromise })

  try {
    // Load similarity data
    const dataDir = path.join(process.cwd(), 'data', 'internal-links')
    const similarityPath = path.join(dataDir, 'similarity-data.json')
    const indexPath = path.join(dataDir, 'post-index.json')

    const [similarityData, indexData] = await Promise.all([
      fs.readFile(similarityPath, 'utf-8').then(d => JSON.parse(d) as SimilarityData).catch(() => null),
      fs.readFile(indexPath, 'utf-8').then(d => JSON.parse(d) as PostIndex[]).catch(() => null)
    ])

    if (!similarityData || !indexData) {
      console.log('⚠️  No similarity data found. Run index building first:')
      console.log('   pnpm tsx scripts/internal-links/01-build-index-fixed.ts')
      return
    }

    // Create post lookup
    const postLookup = new Map<string, PostIndex>()
    for (const post of indexData) {
      postLookup.set(post.id, post)
    }

    // Process posts
    let processed = 0
    let totalLinksAdded = 0

    const posts = await payload.find({
      collection: 'posts',
      limit: 100,
      depth: 0
    })

    console.log(`📊 Processing ${posts.docs.length} posts...`)
    console.log('')

    for (const post of posts.docs) {
      if (!post.content?.root) continue

      const similarPosts = similarityData.similarities[post.id]?.similar || []

      if (similarPosts.length === 0) continue

      console.log(`📝 ${post.title || post.slug}`)

      const contentText = extractText(post.content.root)

      // Find valid targets with safe anchor phrases
      const validTargets: Array<{post: PostIndex; phrases: Array<{phrase: string; position: number}>}> = []

      for (const similar of similarPosts) {
        if (similar.score < 0.7) continue // High quality threshold
        if (similar.id === post.id) continue // No self-links
        if (!isLinkAllowed(post.id, similar.id)) continue // No bidirectional

        const targetPost = postLookup.get(similar.id)
        if (!targetPost) continue

        const validPhrases = findValidAnchorPhrases(contentText, targetPost)

        if (validPhrases.length > 0) {
          validTargets.push({ post: targetPost, phrases: validPhrases })
          recordLink(post.id, similar.id)
        }
      }

      if (validTargets.length > 0) {
        const { content: updatedContent, linksAdded } = applyInternalLinks(
          post.content,
          validTargets,
          5
        )

        if (linksAdded > 0) {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: updatedContent
            }
          })

          console.log(`   ✅ Added ${linksAdded} internal links`)
          totalLinksAdded += linksAdded
          processed++
        } else {
          console.log(`   ⚠️  No suitable positions for links`)
        }
      } else {
        console.log(`   ⚠️  No valid link targets found`)
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Internal Linking Complete!')
    console.log(`   Posts processed: ${processed}`)
    console.log(`   Total links added: ${totalLinksAdded}`)
    console.log(`   Average per post: ${processed > 0 ? (totalLinksAdded / processed).toFixed(1) : 0}`)
    console.log('')
    console.log('📌 All compound words protected!')
    console.log('   • スコアカード remains intact')
    console.log('   • プレーヤー remains intact')
    console.log('   • ゴルファー remains intact')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await payload.db.destroy()
  }
}

main().catch(console.error)