#!/usr/bin/env tsx
/**
 * Build an index of posts with better Japanese phrase extraction
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
 * Extract meaningful Japanese phrases (2-7 characters) that make good anchor text
 */
function extractNaturalPhrases(text: string): string[] {
  const phrases = new Set<string>()
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Key golf-specific compound terms that should be preserved as phrases
  const golfPhrases = [
    // Technical terms
    'スイングプレーン', 'フォロースルー', 'バックスイング', 'ダウンスイング',
    'インパクトゾーン', 'スイングアーク', 'アドレスポジション', 'テークバック',
    
    // Equipment terms  
    'ドライバーショット', 'アイアンショット', 'パターストローク', 'ウェッジショット',
    'フェアウェイウッド', 'ユーティリティクラブ', 'サンドウェッジ', 'ピッチングウェッジ',
    
    // Course terms
    'ティーショット', 'アプローチショット', 'バンカーショット', 'グリーン周り',
    'ラフからの', 'フェアウェイから', 'ピンポジション', 'カップまで',
    
    // Practice terms
    'ミラードリル', '素振り練習', 'パッティング練習', 'アライメント確認',
    'グリップ確認', 'スタンス幅', 'ボール位置', '体重移動',
    
    // Common golf phrases
    'ゴルフスイング', 'ゴルフクラブ', 'ゴルフボール', 'ゴルフコース',
    'ゴルフ練習', 'ゴルフレッスン', 'ゴルフルール', 'ゴルフマナー',
    
    // Score/play terms
    'スコアメイク', 'コースマネジメント', 'クラブ選択', 'ショット選択',
    '飛距離アップ', '方向性向上', 'ミスショット', 'ナイスショット',
    
    // Mental/strategy terms
    'プレショットルーティン', 'コース戦略', 'メンタルゲーム', 'プレッシャー対処',
    'リズムとテンポ', 'スイングテンポ', 'タイミング調整', '集中力向上',
    
    // Beginner terms
    '初心者向け', '初心者ゴルファー', '基本スイング', '基本グリップ',
    '基本スタンス', '基本アドレス', '練習方法', '上達方法'
  ]
  
  // First, find all the predefined golf phrases
  for (const phrase of golfPhrases) {
    if (cleanText.includes(phrase)) {
      phrases.add(phrase)
    }
  }
  
  // Natural Japanese phrase patterns (looking for meaningful combinations)
  const patterns = [
    // Compound nouns with の particle (possessive/descriptive)
    /([ぁ-んァ-ヶー一-龠]{2,4})の([ぁ-んァ-ヶー一-龠]{2,4})/g,
    
    // Technical golf terms (katakana + kanji combinations)
    /[ァ-ヶー]{3,6}[一-龠]{1,3}/g,
    
    // Action phrases (verb stem + noun)
    /([一-龠]{1,3}[りいきしちにみ])([一-龠ァ-ヶー]{2,4})/g,
    
    // Method/technique phrases (〜方, 〜法)
    /[一-龠ァ-ヶー]{2,5}[方法]/g,
    
    // Number + counter + noun patterns
    /[0-9０-９]{1,2}[つ個本番度%％][のと]?[ぁ-んァ-ヶー一-龠]{2,4}/g,
    
    // Common error/mistake patterns
    /[一-龠]{2,4}ミス/g,
    /間違った[一-龠ァ-ヶー]{2,5}/g,
    /正しい[一-龠ァ-ヶー]{2,5}/g,
    
    // Percentage patterns (for statistics)
    /[0-9０-９]{2,3}[%％]の[ぁ-んァ-ヶー一-龠]{2,5}/g,
    
    // Cost/price patterns
    /[0-9０-９]+万円の[一-龠ァ-ヶー]{2,5}/g
  ]
  
  for (const pattern of patterns) {
    let match
    const patternCopy = new RegExp(pattern.source, pattern.flags)
    while ((match = patternCopy.exec(cleanText)) !== null) {
      const phrase = match[0].trim()
      // Filter for natural phrase length (3-12 characters)
      if (phrase.length >= 3 && phrase.length <= 12) {
        // Avoid phrases that are just particles or too generic
        if (!/^[のがをはでにへとも]+$/.test(phrase)) {
          phrases.add(phrase)
        }
      }
    }
  }
  
  // Extract meaningful segments between punctuation
  const segments = cleanText.split(/[。、！？「」『』（）]/g)
  for (const segment of segments) {
    const trimmed = segment.trim()
    // Look for complete meaningful phrases
    if (trimmed.length >= 4 && trimmed.length <= 10) {
      // Must contain substantial content (kanji or katakana)
      if (/[一-龠ァ-ヶー]{3,}/.test(trimmed)) {
        // Avoid pure hiragana (usually particles/helpers)
        if (!/^[ぁ-ん]+$/.test(trimmed)) {
          phrases.add(trimmed)
        }
      }
    }
  }
  
  // Return diverse set of phrases, prioritizing longer ones
  return Array.from(phrases)
    .sort((a, b) => b.length - a.length) // Longer phrases first
    .slice(0, 100) // Limit to top 100 phrases
}

/**
 * Extract text content from Lexical editor format
 */
function extractTextFromContent(content: any): string {
  if (!content?.root?.children) return ''
  
  const texts: string[] = []
  
  function extractFromNode(node: any): string {
    if (node.type === 'text') return node.text || ''
    if (node.type === 'link' && node.children) {
      return node.children.map(extractFromNode).join('')
    }
    if (node.children) {
      return node.children.map(extractFromNode).join(' ')
    }
    return ''
  }
  
  for (const child of content.root.children) {
    texts.push(extractFromNode(child))
  }
  
  return texts.join(' ')
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
  console.log('Building improved post index for internal linking...')
  
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
      const textContent = extractTextFromContent(post.content)
      const language = detectLanguage(textContent)
      
      // Extract anchor phrases - focus on natural multi-word phrases
      const anchorPhrases = language === 'ja' 
        ? extractNaturalPhrases(textContent)
        : [] // Skip English posts
      
      // Extract keywords from various sources
      const keywords: Set<string> = new Set()
      
      // Add title words
      if (post.title) {
        const titlePhrases = extractNaturalPhrases(post.title)
        titlePhrases.forEach(phrase => keywords.add(phrase))
      }
      
      // Add SEO keywords
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
      console.log(`✓ Indexed: ${post.title} (${anchorPhrases.length} phrases)`)
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
    const japanesePosts = indexedPosts.filter(p => p.language === 'ja').length
    const englishPosts = indexedPosts.filter(p => p.language === 'en').length
    const avgPhrases = indexedPosts.reduce((sum, p) => sum + p.anchorPhrases.length, 0) / indexedPosts.length
    
    console.log('\n📈 Statistics:')
    console.log(`  - Japanese posts: ${japanesePosts}`)
    console.log(`  - English posts: ${englishPosts}`)
    console.log(`  - Avg anchor phrases per post: ${Math.round(avgPhrases)}`)
    
    // Show sample phrases
    const samplePost = indexedPosts.find(p => p.anchorPhrases.length > 10)
    if (samplePost) {
      console.log('\n🔍 Sample phrases from "' + samplePost.title + '":')
      console.log('  ' + samplePost.anchorPhrases.slice(0, 10).join(', '))
    }
    
  } catch (error) {
    console.error('❌ Error building index:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

buildIndex().catch(console.error)