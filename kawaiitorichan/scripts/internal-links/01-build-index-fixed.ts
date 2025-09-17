#!/usr/bin/env tsx
/**
 * Build an index of posts with PROPER Japanese phrase extraction
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'internal-links')

interface PostIndex {
  id: string
  title: string
  slug: string
  excerpt?: string
  keywords: string[]
  anchorPhrases: string[]
  contentHash: string
  language: 'ja' | 'en'
  textContent: string
}

/**
 * Properly extract text from Lexical editor format
 * This handles nested structures and preserves complete text
 */
function extractTextFromLexical(node: any, result: string[] = []): string {
  if (!node) return result.join('')
  
  // Handle text nodes
  if (node.type === 'text' && node.text) {
    result.push(node.text)
    return result.join('')
  }
  
  // Handle nodes with children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractTextFromLexical(child, result)
    }
  }
  
  return result.join('')
}

/**
 * Extract meaningful Japanese phrases that make good anchor text
 */
function extractJapanesePhrases(text: string): string[] {
  const phrases = new Set<string>()
  
  // Clean the text
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Golf-specific compound terms (these are meaningful multi-word phrases)
  const golfCompounds = [
    // Technical swing terms
    'ゴルフスイング', 'スイングプレーン', 'バックスイング', 'ダウンスイング',
    'フォロースルー', 'インパクトゾーン', 'スイングアーク', 'テークバック',
    'アドレスポジション', 'トップオブスイング', 'スイングパス', 'スイングテンポ',
    
    // Club and shot types
    'ドライバーショット', 'アイアンショット', 'パターストローク', 'ウェッジショット',
    'フェアウェイウッド', 'ユーティリティクラブ', 'サンドウェッジ', 'ピッチングウェッジ',
    'ロブウェッジ', 'ギャップウェッジ',
    
    // Course management
    'ティーショット', 'アプローチショット', 'バンカーショット', 'グリーン周り',
    'ピンポジション', 'コースマネジメント', 'クラブ選択', 'ショット選択',
    'コース戦略', 'ホールレイアウト', 'グリーンリーディング',
    
    // Practice and improvement
    'ゴルフ練習', 'ゴルフレッスン', '練習方法', '上達方法',
    '飛距離アップ', '方向性向上', 'スコアメイク', 'ミスショット',
    'スイング改善', 'グリップ練習', 'パッティング練習', 'ショートゲーム',
    
    // Equipment
    'ゴルフクラブ', 'ゴルフボール', 'ゴルフシューズ', 'ゴルフグローブ',
    'キャディバッグ', 'ゴルフウェア', 'レンジファインダー', 'スコアカード',
    
    // Rules and etiquette
    'ゴルフルール', 'ゴルフマナー', 'エチケット', 'ローカルルール',
    'ペナルティストローク', 'アンプレイアブル', 'ウォーターハザード', 'OBライン',
    
    // Mental game
    'メンタルゲーム', 'プレッシャー対処', '集中力向上', 'ルーティン確立',
    'プレショットルーティン', 'ポストショットルーティン', 'ビジュアライゼーション',
    
    // Common terms for beginners
    '初心者ゴルファー', '初心者向け', 'ゴルフ入門', 'ゴルフデビュー',
    '基本スイング', '基本グリップ', '基本スタンス', '基本アドレス'
  ]
  
  // First, extract all predefined golf compound terms
  for (const compound of golfCompounds) {
    if (cleanText.includes(compound)) {
      phrases.add(compound)
    }
  }
  
  // Extract natural Japanese phrases from the text
  // Split by punctuation to get sentence fragments
  const sentences = cleanText.split(/[。、！？「」『』（）]/g)
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue
    
    // Look for noun phrases connected by particles
    // Pattern: [名詞/動詞]の[名詞] (e.g., "スイングの基本")
    const nounPhrases = trimmed.match(/[ァ-ヶー一-龠]{2,}[のとで][ァ-ヶー一-龠]{2,}/g)
    if (nounPhrases) {
      for (const phrase of nounPhrases) {
        if (phrase.length >= 4 && phrase.length <= 15) {
          phrases.add(phrase)
        }
      }
    }
    
    // Look for compound katakana + kanji terms (common in golf)
    const compoundTerms = trimmed.match(/[ァ-ヶー]{3,}[一-龠]{1,4}/g)
    if (compoundTerms) {
      for (const term of compoundTerms) {
        if (term.length >= 4 && term.length <= 12) {
          phrases.add(term)
        }
      }
    }
    
    // Look for verb phrases (e.g., "飛距離を伸ばす")
    const verbPhrases = trimmed.match(/[一-龠]{2,}[をがに][一-龠]{2,}[するくいうつむぶぬぐずじ]/g)
    if (verbPhrases) {
      for (const phrase of verbPhrases) {
        if (phrase.length >= 5 && phrase.length <= 15) {
          phrases.add(phrase)
        }
      }
    }
    
    // Look for descriptive phrases (形容詞 + 名詞)
    const descriptivePhrases = trimmed.match(/[良悪正確適切基本重要大小高低早遅強弱][いしくかな]*[ァ-ヶー一-龠]{2,}/g)
    if (descriptivePhrases) {
      for (const phrase of descriptivePhrases) {
        if (phrase.length >= 3 && phrase.length <= 10) {
          phrases.add(phrase)
        }
      }
    }
  }
  
  // Extract important standalone golf terms (but only if they're meaningful)
  const importantTerms = [
    'ドライバー', 'アイアン', 'パター', 'ウェッジ', 'フェアウェイ',
    'グリーン', 'バンカー', 'ラフ', 'ティー', 'ピン', 'カップ',
    'スイング', 'グリップ', 'スタンス', 'アドレス', 'インパクト',
    'フォロー', 'フィニッシュ', 'テンポ', 'リズム', 'タイミング',
    'スライス', 'フック', 'ドロー', 'フェード', 'プッシュ', 'プル',
    'トップ', 'ダフり', 'シャンク', 'チーピン', 'テンプラ',
    'パー', 'バーディ', 'イーグル', 'ボギー', 'アルバトロス',
    'ハンディキャップ', 'スコア', 'ストローク', 'ヤード', 'メートル'
  ]
  
  for (const term of importantTerms) {
    if (cleanText.includes(term)) {
      // Only add standalone terms if they appear in a meaningful context
      const contextPattern = new RegExp(`[ァ-ヶー一-龠]*${term}[ァ-ヶー一-龠]*`, 'g')
      const matches = cleanText.match(contextPattern)
      if (matches) {
        for (const match of matches) {
          // Add the extended phrase if it's longer than just the term
          if (match.length > term.length) {
            phrases.add(match)
          } else {
            // Add the term itself if it appears standalone
            phrases.add(term)
          }
        }
      }
    }
  }
  
  // Filter and sort phrases
  const finalPhrases = Array.from(phrases)
    .filter(phrase => {
      // Remove single characters
      if (phrase.length < 2) return false
      // Remove phrases that are just particles
      if (/^[のがをはでにへとも]+$/.test(phrase)) return false
      // Keep everything else
      return true
    })
    // Sort by relevance: longer phrases first, then by frequency in text
    .sort((a, b) => {
      // Prioritize golf-specific compounds
      const aIsCompound = golfCompounds.includes(a)
      const bIsCompound = golfCompounds.includes(b)
      if (aIsCompound && !bIsCompound) return -1
      if (!aIsCompound && bIsCompound) return 1
      
      // Then by length (longer = more specific)
      if (b.length !== a.length) return b.length - a.length
      
      // Then alphabetically
      return a.localeCompare(b)
    })
    .slice(0, 100) // Limit to top 100 phrases
  
  return finalPhrases
}

/**
 * Detect language of text
 */
function detectLanguage(text: string): 'ja' | 'en' {
  const japaneseChars = text.match(/[ぁ-んァ-ヶー一-龠]/g) || []
  const englishChars = text.match(/[a-zA-Z]/g) || []
  return japaneseChars.length > englishChars.length ? 'ja' : 'en'
}

/**
 * Generate content hash
 */
function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

async function buildIndex() {
  console.log('Building FIXED post index for internal linking...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Fetch all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: { equals: 'published' }
      },
      depth: 1 // Include related fields
    })
    
    console.log(`Found ${posts.length} published posts`)
    
    const indexedPosts: PostIndex[] = []
    
    for (const post of posts) {
      // Properly extract text from Lexical content
      const textContent = extractTextFromLexical(post.content?.root)
      const language = detectLanguage(textContent + ' ' + (post.title || ''))
      
      // Extract anchor phrases based on language
      let anchorPhrases: string[] = []
      if (language === 'ja') {
        anchorPhrases = extractJapanesePhrases(textContent + ' ' + (post.title || ''))
      }
      
      // Extract keywords from various sources
      const keywords: Set<string> = new Set()
      
      // Add title-based phrases
      if (post.title && language === 'ja') {
        const titlePhrases = extractJapanesePhrases(post.title)
        titlePhrases.forEach(phrase => keywords.add(phrase))
      }
      
      // Add SEO keywords if available
      if (post.meta?.keywords) {
        post.meta.keywords.split(',').forEach((kw: string) => {
          const cleaned = kw.trim()
          if (cleaned.length >= 2) keywords.add(cleaned)
        })
      }
      
      // Add category names
      if (post.categories && Array.isArray(post.categories)) {
        for (const cat of post.categories) {
          if (typeof cat === 'object' && cat.title) {
            keywords.add(cat.title)
          }
        }
      }
      
      const indexed: PostIndex = {
        id: String(post.id),
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        keywords: Array.from(keywords),
        anchorPhrases: anchorPhrases,
        contentHash: generateContentHash(textContent),
        language,
        textContent: textContent.substring(0, 5000) // Store first 5000 chars for reference
      }
      
      indexedPosts.push(indexed)
      
      // Show sample phrases for debugging
      if (anchorPhrases.length > 0) {
        console.log(`✓ ${post.title}`)
        console.log(`  Sample phrases: ${anchorPhrases.slice(0, 5).join(', ')}`)
      } else {
        console.log(`⚠ ${post.title} (no phrases extracted)`)
      }
    }
    
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    
    // Save index
    const outputPath = path.join(OUTPUT_DIR, 'posts-index.json')
    await fs.writeFile(
      outputPath,
      JSON.stringify({ posts: indexedPosts, timestamp: new Date().toISOString() }, null, 2)
    )
    
    console.log('\n✅ Index built successfully!')
    console.log(`📁 Saved to: ${outputPath}`)
    console.log(`📊 Total posts indexed: ${indexedPosts.length}`)
    
    // Statistics
    const japanesePosts = indexedPosts.filter(p => p.language === 'ja')
    const withPhrases = japanesePosts.filter(p => p.anchorPhrases.length > 0)
    const avgPhrases = japanesePosts.reduce((sum, p) => sum + p.anchorPhrases.length, 0) / Math.max(japanesePosts.length, 1)
    
    console.log('\n📈 Statistics:')
    console.log(`  - Japanese posts: ${japanesePosts.length}`)
    console.log(`  - Posts with phrases: ${withPhrases.length}`)
    console.log(`  - Avg phrases per Japanese post: ${Math.round(avgPhrases)}`)
    
  } catch (error) {
    console.error('❌ Error building index:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

buildIndex().catch(console.error)