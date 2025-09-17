#!/usr/bin/env tsx
/**
 * Build index of all posts for internal linking
 * Extracts metadata, content, and potential anchor keywords
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

interface PostIndex {
  id: string
  slug: string
  title: string
  excerpt: string
  contentSummary: string
  categories: string[]
  tags: string[]
  language: string
  keywords: string[]
  anchorPhrases: string[]
  publishedAt: string | null
  contentHash: string
}

interface IndexData {
  version: string
  generatedAt: string
  posts: PostIndex[]
}

/**
 * Extract text content from Lexical nodes
 */
function extractTextFromLexical(node: any): string {
  if (!node) return ''
  
  let text = ''
  
  // Handle text nodes
  if (node.type === 'text' && node.text) {
    text += node.text + ' '
  }
  
  // Recursively process children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      text += extractTextFromLexical(child)
    }
  }
  
  // Process root node
  if (node.root) {
    text += extractTextFromLexical(node.root)
  }
  
  return text
}

/**
 * Extract potential anchor phrases from text
 * These are phrases that could be used as internal link anchors
 */
function extractAnchorPhrases(text: string, title: string): string[] {
  const phrases: Set<string> = new Set()
  
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim()
  
  // Japanese golf term patterns
  const japaneseGolfTerms = [
    // Basic golf terms
    'ゴルフ', 'スイング', 'クラブ', 'ボール', 'コース', 'ホール', 'パー',
    'バーディー', 'イーグル', 'ボギー', 'パット', 'ドライブ', 'チップ',
    'ピッチ', 'バンカー', 'フェアウェイ', 'グリーン', 'ティー', 'スタンス',
    'グリップ', 'アドレス', 'テークバック', 'ダウンスイング', 'インパクト',
    'フォロースルー', 'フィニッシュ', 'スイングプレーン', 'リリース',
    'ドロー', 'フェード', 'スライス', 'フック', 'プッシュ', 'プル',
    // Compound terms
    'バックスイング', 'トップスイング', 'ミスショット', 'ベストスコア',
    'アプローチショット', 'ティーショット', 'セカンドショット',
    'パターグリップ', 'ドライバーショット', 'アイアンショット',
    // Common phrases
    '飛距離', '方向性', '安定性', '基本', '練習', 'コースマネジメント',
    'スコアアップ', 'スイング改善', 'ゴルフ上達', '初心者',
    'ゴルフレッスン', 'ゴルフスクール', 'ゴルフ練習', 'ゴルフ場',
    '打ちっぱなし', '練習場', 'ラウンド', 'コンペ', 'スコア',
    // Technical terms
    'ヘッドスピード', 'ミート率', 'スピン量', '打ち出し角',
    'クラブフェース', 'スイング軌道', 'ボール位置', '体重移動',
    '肩の回転', '腰の回転', '手首の角度', 'グリッププレッシャー'
  ]
  
  // Extract Japanese golf terms from text
  for (const term of japaneseGolfTerms) {
    // Add the base term if it exists in the text
    if (cleanText.includes(term)) {
      phrases.add(term)
    }
    
    // Look for compound terms (but limit extension to avoid particles)
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Only extend with katakana or up to 2 kanji characters to avoid particles
    const regex = new RegExp(`${escapedTerm}[ァ-ヶー]{0,4}|${escapedTerm}[\u4E00-\u9FAF]{1,2}`, 'gi')
    let match
    while ((match = regex.exec(cleanText)) !== null) {
      const phrase = match[0].trim()
      // Only add if it's different from the base term and reasonable length
      if (phrase !== term && phrase.length >= 2 && phrase.length < 15) {
        phrases.add(phrase)
      }
    }
  }
  
  // Also add "ゴルファー" as a standalone term if it appears
  if (cleanText.includes('ゴルファー')) {
    phrases.add('ゴルファー')
  }
  
  // Extract Japanese compound nouns (2-6 kanji/katakana combinations)
  const japaneseNounRegex = /[\u30A0-\u30FF\u4E00-\u9FAF]{2,6}/g
  let match
  while ((match = japaneseNounRegex.exec(cleanText)) !== null) {
    const phrase = match[0].trim()
    // Filter for golf-related terms
    if (japaneseGolfTerms.some(term => phrase.includes(term))) {
      phrases.add(phrase)
    }
  }
  
  // Extract title parts for Japanese
  if (title.includes('：')) {
    // Split by Japanese colon
    const parts = title.split('：')
    parts.forEach(part => {
      const cleaned = part.trim()
      if (cleaned.length >= 2 && cleaned.length < 30) {
        phrases.add(cleaned)
      }
    })
  }
  
  // Add the full title
  phrases.add(title)
  
  // Extract numbers with context (e.g., "90%", "3秒", "20打")
  const numberPatternRegex = /\d+[%％]?[\u4E00-\u9FAF]{1,3}/g
  while ((match = numberPatternRegex.exec(cleanText)) !== null) {
    const phrase = match[0].trim()
    if (phrase.length >= 2) {
      phrases.add(phrase)
    }
  }
  
  
  return Array.from(phrases).slice(0, 100) // Increase limit for better coverage
}

/**
 * Extract keywords from SEO metadata and content
 */
function extractKeywords(post: any, textContent: string): string[] {
  const keywords: Set<string> = new Set()
  
  // Add SEO keywords
  if (post.meta?.keywords) {
    post.meta.keywords.split(',').forEach((kw: string) => {
      keywords.add(kw.trim().toLowerCase())
    })
  }
  
  // Add focus keyphrase
  if (post.meta?.focusKeyphrase) {
    keywords.add(post.meta.focusKeyphrase.toLowerCase())
  }
  
  // Extract Japanese keywords using a different approach
  // For Japanese, we look for katakana and kanji compounds
  const japaneseKeywordRegex = /[\u30A0-\u30FF]{3,}|[\u4E00-\u9FAF]{2,4}/g
  let match
  while ((match = japaneseKeywordRegex.exec(textContent)) !== null) {
    const word = match[0]
    if (word.length >= 2 && word.length <= 10) {
      keywords.add(word)
    }
  }
  
  // Also extract Latin words for mixed content
  const words = textContent.toLowerCase().split(/\W+/)
  const wordFreq: Map<string, number> = new Map()
  
  // Count word frequencies
  for (const word of words) {
    if (word.length > 4 && !isStopWord(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  }
  
  // Get top frequent words
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
  
  sortedWords.forEach(word => keywords.add(word))
  
  return Array.from(keywords)
}

/**
 * Check if a word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
    'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'about', 'after', 'also', 'back',
    'because', 'but', 'even', 'for', 'from', 'get', 'give', 'go', 'good',
    'great', 'if', 'in', 'into', 'its', 'like', 'make', 'many', 'over',
    'or', 'out', 'see', 'such', 'take', 'their', 'them', 'then', 'there',
    'these', 'they', 'through', 'to', 'up', 'use', 'with', 'your'
  ])
  
  return stopWords.has(word.toLowerCase())
}

/**
 * Generate a hash for content
 */
function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

async function buildIndex() {
  console.log('Building post index for internal linking...')
  
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Fetch all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: {
          equals: 'published'
        }
      },
      depth: 2, // Include relationships
    })
    
    console.log(`Found ${posts.length} published posts`)
    
    const indexData: IndexData = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      posts: [],
    }
    
    for (const post of posts) {
      try {
        // Extract text content from Lexical
        const textContent = extractTextFromLexical(post.content)
        const excerptText = post.excerpt ? extractTextFromLexical(post.excerpt) : ''
        
        // Get first 500 characters as summary
        const contentSummary = textContent.substring(0, 500).trim()
        
        // Extract categories and tags
        const categories = Array.isArray(post.categories) 
          ? post.categories.map((cat: any) => 
              typeof cat === 'object' ? (cat.title || cat.name || '') : ''
            ).filter(Boolean)
          : []
        
        const tags = Array.isArray(post.tags)
          ? post.tags.map((tag: any) =>
              typeof tag === 'object' ? (tag.title || tag.name || '') : ''
            ).filter(Boolean)
          : []
        
        // Extract keywords and anchor phrases
        const keywords = extractKeywords(post, textContent)
        const anchorPhrases = extractAnchorPhrases(textContent, post.title)
        
        // Generate content hash
        const contentHash = generateContentHash(textContent)
        
        const postIndex: PostIndex = {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: excerptText.substring(0, 200),
          contentSummary,
          categories,
          tags,
          language: post.language || 'ja',
          keywords,
          anchorPhrases,
          publishedAt: post.publishedAt || null,
          contentHash,
        }
        
        indexData.posts.push(postIndex)
        console.log(`✓ Indexed: ${post.title}`)
      } catch (error) {
        console.error(`Failed to index post ${post.id}:`, error)
      }
    }
    
    // Save index to file
    const indexPath = path.join(process.cwd(), 'data', 'internal-links', 'posts-index.json')
    await fs.mkdir(path.dirname(indexPath), { recursive: true })
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
    
    console.log(`\n✅ Index built successfully!`)
    console.log(`📁 Saved to: ${indexPath}`)
    console.log(`📊 Total posts indexed: ${indexData.posts.length}`)
    
    // Save summary statistics
    const stats = {
      totalPosts: indexData.posts.length,
      byLanguage: {
        ja: indexData.posts.filter(p => p.language === 'ja').length,
        en: indexData.posts.filter(p => p.language === 'en').length,
      },
      averageKeywords: Math.round(
        indexData.posts.reduce((sum, p) => sum + p.keywords.length, 0) / indexData.posts.length
      ),
      averageAnchorPhrases: Math.round(
        indexData.posts.reduce((sum, p) => sum + p.anchorPhrases.length, 0) / indexData.posts.length
      ),
    }
    
    console.log('\n📈 Statistics:')
    console.log(`  - Japanese posts: ${stats.byLanguage.ja}`)
    console.log(`  - English posts: ${stats.byLanguage.en}`)
    console.log(`  - Avg keywords per post: ${stats.averageKeywords}`)
    console.log(`  - Avg anchor phrases per post: ${stats.averageAnchorPhrases}`)
    
  } catch (error) {
    console.error('Error building index:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run if called directly
buildIndex()