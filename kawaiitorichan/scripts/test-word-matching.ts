#!/usr/bin/env tsx
/**
 * Test why compound words are being broken
 */

// Test the current matching logic
function hasExactWordMatch(text: string, keyword: string): { found: boolean; index: number } {
  const textLower = text.toLowerCase()
  const keywordLower = keyword.toLowerCase()

  let index = textLower.indexOf(keywordLower)

  while (index !== -1) {
    // Check character before
    const charBefore = index > 0 ? text[index - 1] : ''
    const charAfter = index + keyword.length < text.length ? text[index + keyword.length] : ''

    console.log(`Testing "${keyword}" in "${text}"`)
    console.log(`  Found at index ${index}`)
    console.log(`  Char before: "${charBefore}"`)
    console.log(`  Char after: "${charAfter}"`)

    // Current logic from the script
    const isStartBoundary = index === 0 || isJapaneseBoundary(charBefore)
    const isEndBoundary = index + keyword.length === text.length || isJapaneseBoundary(charAfter)

    console.log(`  Start boundary OK: ${isStartBoundary}`)
    console.log(`  End boundary OK: ${isEndBoundary}`)

    // Special compound check
    const isCompound = (keywordLower === 'ゴルフ' && charAfter === 'ァ') ||
                       (keywordLower === 'パット' && charAfter === 'タ')

    console.log(`  Is compound: ${isCompound}`)
    console.log(`  Would match: ${isStartBoundary && isEndBoundary && !isCompound}`)
    console.log('')

    if (isStartBoundary && isEndBoundary && !isCompound) {
      return { found: true, index }
    }

    index = textLower.indexOf(keywordLower, index + 1)
  }

  return { found: false, index: -1 }
}

function isJapaneseBoundary(char: string): boolean {
  if (!char) return true

  const boundaries = [
    '。', '、', '！', '？', '（', '）', '「', '」', '『', '』',
    '【', '】', '・', '〜', '　', ' ', '\n', '\t',
    ',', '.', '!', '?', '(', ')', '[', ']', '{', '}',
    ':', ';', '"', "'", '-', '/', '\\'
  ]

  return boundaries.includes(char)
}

// Test cases
const testCases = [
  { text: 'スコアカードに記録する', keyword: 'スコア' },
  { text: 'プレーヤーが上達する', keyword: 'プレー' },
  { text: 'ゴルファーの基本', keyword: 'ゴルフ' },
  { text: 'スコアを改善する', keyword: 'スコア' },
  { text: 'プレーを楽しむ', keyword: 'プレー' },
  { text: 'ゴルフを始める', keyword: 'ゴルフ' },
]

console.log('Testing Current Word Matching Logic')
console.log('=' .repeat(60))
console.log('')

for (const { text, keyword } of testCases) {
  const result = hasExactWordMatch(text, keyword)
  console.log(`Result: ${result.found ? '✗ MATCHES (will break word)' : '✓ NO MATCH (correct)'}`)
  console.log('-'.repeat(40))
}

console.log('\n🔍 PROBLEM IDENTIFIED:')
console.log('The issue is that カード, ヤー, ァー are NOT in the boundary list!')
console.log('Japanese katakana characters are not considered word boundaries.')
console.log('So "スコア" + "カード" is seen as two separate words.')
console.log('')
console.log('SOLUTION: We need to check if the keyword is part of a longer')
console.log('compound word by looking at the surrounding characters more carefully.')