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
 * Common Japanese verb endings for proper phrase completion
 */
const VERB_ENDINGS = [
  'する', 'した', 'して', 'すれば', 'しよう', 'します', 'しない', 'しました',
  'くる', 'きた', 'きて', 'くれば', 'こよう', 'きます', 'こない', 'きました',
  'いる', 'いた', 'いて', 'いれば', 'いよう', 'います', 'いない', 'いました',
  'ある', 'あった', 'あって', 'あれば', 'あろう', 'あります', 'ない', 'ありました',
  'できる', 'できた', 'できて', 'できれば', 'できよう', 'できます', 'できない', 'できました',
  'なる', 'なった', 'なって', 'なれば', 'なろう', 'なります', 'ならない', 'なりました',
  'れる', 'られる', 'せる', 'させる', 'れた', 'られた', 'せた', 'させた'
]

/**
 * Check if a phrase ends with a broken verb stem
 */
function isBrokenVerb(phrase: string): boolean {
  // Common patterns of truncated verbs
  const brokenPatterns = [
    /[^で][すく]$/, // ends with す or く (but not です)
    /[いう]$/, // ends with い or う (could be incomplete)
    /[つむぶぬぐずじ]$/ // other incomplete verb stems
  ]

  return brokenPatterns.some(pattern => pattern.test(phrase))
}

/**
 * Attempt to complete a broken verb phrase
 */
function completeVerb(phrase: string, fullText: string): string {
  // Look for the complete verb in the surrounding text
  for (const ending of VERB_ENDINGS) {
    const possibleComplete = phrase + ending.substring(phrase.length > 0 ? phrase[phrase.length - 1] === ending[0] ? 1 : 0 : 0)
    if (fullText.includes(possibleComplete)) {
      return possibleComplete
    }
  }

  // If no complete version found, try common completions
  if (phrase.endsWith('す') && !phrase.endsWith('です')) {
    return phrase + 'る'
  }
  if (phrase.endsWith('く')) {
    return phrase + 'る'
  }

  return phrase // Return as-is if can't complete
}

/**
 * Extract meaningful Japanese phrases that make good anchor text (UNIVERSAL VERSION)
 */
function extractJapanesePhrases(text: string): string[] {
  const phrases = new Set<string>()
  
  // Clean the text
  const cleanText = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Extract compound nouns (katakana + kanji or kanji + katakana combinations)
  const compoundNouns = cleanText.match(/[ァ-ヶー]{2,}[一-龠]{1,}|[一-龠]{2,}[ァ-ヶー]{1,}/g)
  if (compoundNouns) {
    for (const compound of compoundNouns) {
      if (compound.length >= 3 && compound.length <= 12 && !isMetadataPhrase(compound)) {
        phrases.add(compound)
      }
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
    
    // Look for compound katakana + kanji terms (universal pattern)
    const compoundTerms = trimmed.match(/[ァ-ヶー]{3,}[一-龠]{1,4}/g)
    if (compoundTerms) {
      for (const term of compoundTerms) {
        if (term.length >= 4 && term.length <= 12 && !isMetadataPhrase(term)) {
          phrases.add(term)
        }
      }
    }
    
    // Look for complete verb phrases with proper endings
    const verbPhrases = trimmed.match(/[一-龠]{2,}[をがに][一-龠]{2,}(する|くる|いる|ある|できる|なる|れる|られる|せる|させる|した|きた|いた|あった|できた|なった|れた|られた|せた|させた|して|きて|いて|あって|できて|なって|れて|られて|せて|させて)/g)
    if (verbPhrases) {
      for (const phrase of verbPhrases) {
        if (phrase.length >= 5 && phrase.length <= 15 && !isMetadataPhrase(phrase)) {
          phrases.add(phrase)
        }
      }
    }

    // Also look for potentially broken verb phrases and try to complete them
    const potentialVerbPhrases = trimmed.match(/[一-龠]{2,}[をがに][一-龠]{2,}[すくいうつむぶぬぐずじ]/g)
    if (potentialVerbPhrases) {
      for (const phrase of potentialVerbPhrases) {
        if (phrase.length >= 5 && phrase.length <= 15 && !isMetadataPhrase(phrase)) {
          // Try to complete the verb
          const completed = completeVerb(phrase, cleanText)
          if (completed !== phrase) {
            phrases.add(completed)
          }
        }
      }
    }
    
    // Look for descriptive phrases (形容詞 + 名詞)
    const descriptivePhrases = trimmed.match(/[良悪正確適切基本重要大小高低早遅強弱][いしくかな]*[ァ-ヶー一-龠]{2,}/g)
    if (descriptivePhrases) {
      for (const phrase of descriptivePhrases) {
        if (phrase.length >= 3 && phrase.length <= 10 && !isMetadataPhrase(phrase)) {
          phrases.add(phrase)
        }
      }
    }
  }
  
  // Extract meaningful standalone terms from the content itself (no hardcoding)
  // Look for terms that appear multiple times (likely important)
  const termCounts = new Map<string, number>()
  const termMatches = cleanText.match(/[ァ-ヶー一-龠]{3,8}/g)
  if (termMatches) {
    for (const term of termMatches) {
      if (!isMetadataPhrase(term)) {
        termCounts.set(term, (termCounts.get(term) || 0) + 1)
      }
    }
  }

  // Add frequently occurring terms (appear 2+ times)
  for (const [term, count] of termCounts) {
    if (count >= 2 && term.length >= 3 && term.length <= 8) {
      phrases.add(term)
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
      // Prioritize longer phrases (more specific)
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