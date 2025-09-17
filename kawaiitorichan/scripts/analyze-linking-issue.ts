#!/usr/bin/env tsx
/**
 * Analyze the root cause of word breaking in linking scripts
 */

console.log('🔍 ROOT CAUSE ANALYSIS: Why Japanese Compound Words Are Breaking')
console.log('=' .repeat(60))
console.log('')

console.log('📌 THE PROBLEM:')
console.log('When the scripts search for keywords like "スコア" or "プレー",')
console.log('they find these strings INSIDE compound words like:')
console.log('  - スコアカード (scorecard) contains スコア (score)')
console.log('  - プレーヤー (player) contains プレー (play)')
console.log('  - ゴルファー (golfer) contains ゴルフ (golf)')
console.log('')

console.log('📌 WHY IT HAPPENS:')
console.log('1. The affiliate script searches for product keywords')
console.log('2. It finds "スコア" inside "スコアカード"')
console.log('3. The `hasExactWordMatch` function checks boundaries BUT...')
console.log('4. Japanese katakana continuation (カード after スコア) is NOT')
console.log('   recognized as part of the same word!')
console.log('')

console.log('📌 THE FLAWED LOGIC:')
console.log('The `isJapaneseBoundary` function only checks for punctuation')
console.log('and spaces, but NOT for word continuation patterns.')
console.log('')
console.log('Example: When checking "スコア" in "スコアカード":')
console.log('  - Character after "スコア" is "カ"')
console.log('  - "カ" is NOT in the boundary list (punctuation)')
console.log('  - So the function thinks it\'s OK to link!')
console.log('')

console.log('📌 THE SOLUTION:')
console.log('We need to detect Japanese compound words properly by:')
console.log('')
console.log('1. CHECKING FOR COMPOUND PATTERNS:')
console.log('   - スコア + カード = compound word, don\'t split')
console.log('   - プレー + ヤー = compound word, don\'t split')
console.log('   - ゴルフ + ァー = compound word, don\'t split')
console.log('')
console.log('2. USING JAPANESE PARTICLES AS BOUNDARIES:')
console.log('   - を, が, は, に, で, から, まで, etc.')
console.log('   - These indicate word boundaries in Japanese')
console.log('')
console.log('3. IMPLEMENTING A COMPOUND WORD DICTIONARY:')
console.log('   - List known compound words that should not be split')
console.log('   - Check if keyword is part of a compound before linking')
console.log('')

// Test with better logic
function isPartOfCompoundWord(text: string, keyword: string, position: number): boolean {
  // Known compound words that contain common keywords
  const compounds = {
    'スコア': ['スコアカード', 'スコアリング', 'スコアボード', 'スコアメイク'],
    'プレー': ['プレーヤー', 'プレースタイル', 'プレーオフ'],
    'ゴルフ': ['ゴルファー', 'ゴルフ場', 'ゴルフクラブ'],
    'パット': ['パッティング', 'パッター'],
    'ショット': ['ショットガン', 'ショットメーカー'],
    'クラブ': ['クラブハウス', 'クラブフェース', 'クラブヘッド'],
  }

  const keywordCompounds = compounds[keyword] || []

  for (const compound of keywordCompounds) {
    // Check if the keyword at this position is part of this compound
    const compoundStart = position - (compound.indexOf(keyword))
    if (compoundStart >= 0 && compoundStart + compound.length <= text.length) {
      const potentialCompound = text.substring(compoundStart, compoundStart + compound.length)
      if (potentialCompound === compound) {
        return true // This keyword is part of a compound word
      }
    }
  }

  return false
}

// Test cases
const testCases = [
  { text: 'スコアカードに記録', keyword: 'スコア', position: 0 },
  { text: 'スコアを改善する', keyword: 'スコア', position: 0 },
  { text: 'プレーヤーが上達', keyword: 'プレー', position: 0 },
  { text: 'プレーを楽しむ', keyword: 'プレー', position: 0 },
]

console.log('📊 TESTING IMPROVED LOGIC:')
console.log('-'.repeat(60))

for (const test of testCases) {
  const isCompound = isPartOfCompoundWord(test.text, test.keyword, test.position)
  console.log(`Text: "${test.text}"`)
  console.log(`Keyword: "${test.keyword}"`)
  console.log(`Result: ${isCompound ? '✓ Part of compound (DON\'T LINK)' : '✗ Not compound (OK TO LINK)'}`)
  console.log('')
}