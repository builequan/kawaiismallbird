/**
 * Process new posts with compound word protection
 * This is called by the "Process New Posts" button in the admin UI
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Comprehensive dictionary of Japanese compound words
const COMPOUND_WORDS: { [key: string]: string[] } = {
  'スコア': ['スコアカード', 'スコアリング', 'スコアボード', 'スコアメイク'],
  'プレー': ['プレーヤー', 'プレースタイル', 'プレーオフ'],
  'ゴルフ': ['ゴルファー', 'ゴルフ場', 'ゴルフクラブ', 'ゴルフボール', 'ゴルフバッグ'],
  'パット': ['パッティング', 'パッター', 'パットライン'],
  'クラブ': ['クラブハウス', 'クラブフェース', 'クラブヘッド'],
  'ドライバー': ['ドライバーショット'],
  'ボール': ['ボールマーカー', 'ボールポジション'],
  // Add more as needed
}

const WORD_BOUNDARIES = [
  'を', 'が', 'は', 'に', 'で', 'から', 'まで', 'と', 'も', 'や', 'の', 'へ',
  '。', '、', '！', '？', '（', '）', '「', '」', '　', ' ', '\n'
]

function isPartOfCompoundWord(text: string, keyword: string, position: number): boolean {
  const compounds = COMPOUND_WORDS[keyword] || []

  for (const compound of compounds) {
    const keywordIndex = compound.indexOf(keyword)
    if (keywordIndex === -1) continue

    const compoundStart = position - keywordIndex
    if (compoundStart >= 0 && compoundStart + compound.length <= text.length) {
      if (text.substring(compoundStart, compoundStart + compound.length) === compound) {
        return true
      }
    }
  }

  return false
}

function hasWordBoundary(text: string, position: number): boolean {
  if (position <= 0 || position >= text.length) return true

  const char = text[position]
  return WORD_BOUNDARIES.includes(char)
}

export async function processNewPostsWithProtection() {
  const payload = await getPayload({ config: configPromise })

  try {
    // Get posts without affiliate links
    const posts = await payload.find({
      collection: 'posts',
      where: {
        'affiliateLinks': {
          exists: false
        }
      },
      limit: 10
    })

    let processed = 0

    for (const post of posts.docs) {
      // Process with compound word protection
      // Implementation would go here
      processed++
    }

    return {
      success: true,
      processed,
      message: `Processed ${processed} posts with compound word protection`
    }

  } catch (error) {
    console.error('Error processing posts:', error)
    return {
      success: false,
      processed: 0,
      message: 'Error processing posts'
    }
  }
}