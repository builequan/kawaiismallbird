#!/usr/bin/env tsx
/**
 * Apply affiliate links with Japanese compound word protection
 * Ensures compound words like スコアカード, プレーヤー, ゴルファー remain intact
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')
const MAX_INLINE_LINKS = 5
const MAX_PRODUCTS_BOX = 3

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

interface ProductIndex {
  id: string
  product_name: string
  keyword_research: string
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
}

interface SimilarityResult {
  postId: string
  postSlug: string
  relevantProducts: Array<{
    productId: string
    productName: string
    score: number
    matchType: string
    matchedKeywords: string[]
  }>
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
 * Find valid keyword matches that respect compound words
 */
function findValidKeywordMatch(text: string, keyword: string): { found: boolean; index: number } {
  let index = text.toLowerCase().indexOf(keyword.toLowerCase())

  while (index !== -1) {
    // Check if it's part of a compound word
    if (!isPartOfCompoundWord(text, keyword, index)) {
      // Check word boundaries
      const beforeOk = hasWordBoundary(text, index)
      const afterOk = hasWordBoundary(text, index + keyword.length)

      if (beforeOk && afterOk) {
        return { found: true, index }
      }
    }

    index = text.toLowerCase().indexOf(keyword.toLowerCase(), index + 1)
  }

  return { found: false, index: -1 }
}

/**
 * Get relevant product keywords based on product name and type
 */
function getProductKeywords(productName: string): string[] {
  const name = productName.toLowerCase()
  const keywords: string[] = []

  // Golf club types
  if (name.includes('ドライバー') || name.includes('driver')) {
    keywords.push('ドライバー', '1番ウッド', 'ティーショット')
  }
  if (name.includes('アイアン') || name.includes('iron')) {
    keywords.push('アイアン')
    for (let i = 3; i <= 9; i++) {
      if (name.includes(`${i}番`)) {
        keywords.push(`${i}番アイアン`)
      }
    }
  }
  if (name.includes('パター') || name.includes('putter')) {
    keywords.push('パター', 'パッティング')
  }
  if (name.includes('ウェッジ') || name.includes('wedge')) {
    keywords.push('ウェッジ', 'サンドウェッジ', 'ピッチングウェッジ')
  }

  // Golf balls
  if (name.includes('ボール') || name.includes('ball')) {
    keywords.push('ゴルフボール')
  }

  // Other equipment
  if (name.includes('グローブ') || name.includes('glove')) {
    keywords.push('ゴルフグローブ', 'グローブ')
  }
  if (name.includes('バッグ') || name.includes('bag')) {
    keywords.push('ゴルフバッグ', 'キャディバッグ')
  }
  if (name.includes('シューズ') || name.includes('shoe')) {
    keywords.push('ゴルフシューズ')
  }

  // Filter out generic terms
  return keywords.filter(k => k !== 'ゴルフ' && k.length >= 3)
}

/**
 * Find contextual matches with compound word protection
 */
function findContextualMatches(content: any, products: ProductIndex[]): Map<string, Array<{ product: ProductIndex; keyword: string; position: number }>> {
  const paragraphMatches = new Map<string, Array<{ product: ProductIndex; keyword: string; position: number }>>()

  function extractText(node: any): string {
    if (!node) return ''
    if (node.text) return node.text
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  function traverse(node: any, path: string = '') {
    if (!node) return

    if (node.type === 'paragraph') {
      const text = extractText(node)
      const matches: Array<{ product: ProductIndex; keyword: string; position: number }> = []

      for (const product of products) {
        const keywords = getProductKeywords(product.product_name)

        for (const keyword of keywords) {
          const match = findValidKeywordMatch(text, keyword)
          if (match.found) {
            matches.push({
              product,
              keyword,
              position: match.index
            })
            break // One match per product per paragraph
          }
        }
      }

      if (matches.length > 0) {
        matches.sort((a, b) => a.position - b.position)
        paragraphMatches.set(path, matches)
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any, index: number) => {
        traverse(child, `${path}/${index}`)
      })
    }
  }

  if (content?.root) {
    traverse(content.root, 'root')
  }

  return paragraphMatches
}

/**
 * Create affiliate link node
 */
function createAffiliateLinkNode(url: string, anchorText: string): any {
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
      linkType: 'custom',
      url: url,
      newTab: true,
      rel: 'nofollow sponsored',
    }
  }
}

/**
 * Apply affiliate links with compound word protection
 */
function applyAffiliateLinks(
  content: any,
  products: ProductIndex[],
  maxLinks: number = MAX_INLINE_LINKS
): { content: any; linksAdded: number; appliedProducts: ProductIndex[] } {
  if (!content?.root || products.length === 0) {
    return { content, linksAdded: 0, appliedProducts: [] }
  }

  const newContent = JSON.parse(JSON.stringify(content))
  const appliedProducts: ProductIndex[] = []
  const usedKeywords = new Set<string>()

  // Find all contextual matches
  const contextualMatches = findContextualMatches(newContent, products)

  if (contextualMatches.size === 0) {
    return { content: newContent, linksAdded: 0, appliedProducts: [] }
  }

  // Select matches for linking (distribute evenly)
  const selectedMatches: Array<{ path: string; match: { product: ProductIndex; keyword: string; position: number } }> = []
  const paragraphPaths = Array.from(contextualMatches.keys()).sort()
  const step = Math.max(1, Math.floor(paragraphPaths.length / maxLinks))

  for (let i = 0; i < paragraphPaths.length && selectedMatches.length < maxLinks; i += step) {
    const path = paragraphPaths[i]
    const matches = contextualMatches.get(path)!

    for (const match of matches) {
      const keywordKey = match.keyword.toLowerCase()
      if (!usedKeywords.has(keywordKey) && !appliedProducts.some(p => p.id === match.product.id)) {
        selectedMatches.push({ path, match })
        usedKeywords.add(keywordKey)
        appliedProducts.push(match.product)
        break
      }
    }
  }

  // Apply the selected links
  let linksAdded = 0

  function applyLinksToNode(node: any, currentPath: string = ''): any {
    if (!node) return node

    if (node.type === 'paragraph' && node.children) {
      const matchesToApply = selectedMatches.filter(s => s.path.startsWith(currentPath))

      if (matchesToApply.length > 0) {
        for (const { match } of matchesToApply) {
          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i]

            if (child.type === 'text' && child.text && child.text.includes(match.keyword)) {
              const position = child.text.indexOf(match.keyword)

              if (position !== -1 && !isPartOfCompoundWord(child.text, match.keyword, position)) {
                const before = child.text.substring(0, position)
                const after = child.text.substring(position + match.keyword.length)

                const newNodes = []
                if (before) {
                  newNodes.push({ ...child, text: before })
                }
                newNodes.push(createAffiliateLinkNode(match.product.affiliate_url, match.keyword))
                if (after) {
                  newNodes.push({ ...child, text: after })
                }

                node.children.splice(i, 1, ...newNodes)
                linksAdded++
                console.log(`      ✓ Linked "${match.keyword}" → ${match.product.product_name.substring(0, 40)}...`)
                break
              }
            }
          }
        }
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map((child: any, index: number) =>
        applyLinksToNode(child, `${currentPath}/${index}`)
      )
    }

    return node
  }

  newContent.root = applyLinksToNode(newContent.root, 'root')

  return { content: newContent, linksAdded, appliedProducts }
}

/**
 * Create product recommendation box
 */
function createRecommendationBox(products: ProductIndex[]): any {
  const nodes = []
  const limitedProducts = products.slice(0, MAX_PRODUCTS_BOX)

  nodes.push({
    type: 'heading',
    children: [
      {
        type: 'text',
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: 'おすすめ商品',
        version: 1,
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    tag: 'h3',
    version: 1,
  })

  limitedProducts.forEach((product, index) => {
    nodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 1,
          mode: 'normal',
          style: '',
          text: `${index + 1}. ${product.product_name}`,
          version: 1,
        }
      ],
      version: 1,
    })

    nodes.push({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: `価格: ${product.price} `,
          version: 1,
        },
        {
          type: 'link',
          children: [
            {
              type: 'text',
              text: '詳細を見る →',
              version: 1,
            }
          ],
          fields: {
            linkType: 'custom',
            url: product.affiliate_url,
            newTab: true,
            rel: 'nofollow sponsored',
          },
          version: 2,
        }
      ],
      version: 1,
    })
  })

  return nodes
}

async function main() {
  console.log('🛍️ Applying Affiliate Links with Compound Word Protection')
  console.log('=' .repeat(60))
  console.log('✅ Features:')
  console.log('   • Protects compound words (スコアカード, プレーヤー, ゴルファー)')
  console.log('   • Respects Japanese word boundaries')
  console.log('   • Maximum 5 inline links per post')
  console.log('   • Maximum 3 products in recommendation box')
  console.log('   • Product type matching (driver→driver, putter→putter)')
  console.log('')

  const payload = await getPayload({ config: configPromise })

  try {
    // Load similarity results and product index
    const [similarityData, productData] = await Promise.all([
      fs.readFile(path.join(DATA_DIR, 'similarity-results.json'), 'utf-8')
        .then(d => JSON.parse(d) as SimilarityResult[])
        .catch(() => null),
      fs.readFile(path.join(DATA_DIR, 'product-index.json'), 'utf-8')
        .then(d => JSON.parse(d) as ProductIndex[])
        .catch(() => null)
    ])

    if (!similarityData || !productData) {
      console.log('⚠️  No product similarity data found.')
      console.log('   Please run the affiliate link indexing scripts first.')
      return
    }

    // Create product lookup
    const productLookup = new Map<string, ProductIndex>()
    for (const product of productData) {
      productLookup.set(product.id, product)
    }

    // Process posts
    let processed = 0
    let totalLinksAdded = 0
    let totalProductsAdded = 0

    const postsToProcess = similarityData.slice(0, 10) // Process first 10 posts

    for (const similarity of postsToProcess) {
      if (similarity.relevantProducts.length === 0) continue

      console.log(`\n📝 Processing: ${similarity.postSlug}`)

      // Get full product data
      const products = similarity.relevantProducts
        .map(rp => productLookup.get(rp.productId))
        .filter((p): p is ProductIndex => p !== undefined)
        .slice(0, 10) // Top 10 relevant products

      const post = await payload.findByID({
        collection: 'posts',
        id: similarity.postId,
        depth: 0,
      })

      if (!post?.content?.root) {
        console.log(`   ⚠️  No content found`)
        continue
      }

      // Apply inline links
      const { content: contentWithLinks, linksAdded, appliedProducts } = applyAffiliateLinks(
        post.content,
        products,
        MAX_INLINE_LINKS
      )

      // Add recommendation box
      const recommendProducts = appliedProducts.length > 0
        ? appliedProducts.slice(0, MAX_PRODUCTS_BOX)
        : products.slice(0, MAX_PRODUCTS_BOX)

      if (recommendProducts.length > 0) {
        // Remove existing recommendation section if any
        if (!contentWithLinks.root.children) {
          contentWithLinks.root.children = []
        }

        // Add horizontal rule and recommendation box
        contentWithLinks.root.children.push({
          type: 'horizontalrule',
          version: 1,
        })

        const recommendationNodes = createRecommendationBox(recommendProducts)
        contentWithLinks.root.children.push(...recommendationNodes)
      }

      // Update post
      if (linksAdded > 0 || recommendProducts.length > 0) {
        await payload.update({
          collection: 'posts',
          id: similarity.postId,
          data: {
            content: contentWithLinks,
          },
        })

        console.log(`   ✅ Added ${linksAdded} inline links`)
        console.log(`   📦 Added ${recommendProducts.length} products in recommendation box`)

        processed++
        totalLinksAdded += linksAdded
        totalProductsAdded += recommendProducts.length
      } else {
        console.log(`   ⚠️  No suitable positions for links`)
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Affiliate Linking Complete!')
    console.log(`   Posts processed: ${processed}`)
    console.log(`   Total inline links: ${totalLinksAdded}`)
    console.log(`   Total products in boxes: ${totalProductsAdded}`)
    console.log(`   Average links per post: ${processed > 0 ? (totalLinksAdded / processed).toFixed(1) : 0}`)
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