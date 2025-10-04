/**
 * Calculate reading time from Lexical content
 * Assumes average reading speed of 200 words per minute for Japanese text
 * (Japanese text is calculated by character count / 2 for word estimation)
 */
export function calculateReadingTime(content: any): number {
  if (!content || !content.root || !content.root.children) {
    return 1 // Default minimum 1 minute
  }

  let totalText = ''

  // Recursively extract text from Lexical nodes
  const extractText = (node: any): void => {
    if (node.text) {
      totalText += node.text
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => extractText(child))
    }
  }

  content.root.children.forEach((node: any) => extractText(node))

  // Count characters and estimate words
  const totalChars = totalText.length

  // For Japanese text: approximate word count is character count / 2
  // For English text: count actual words
  // Mixed approach: if more than 30% Japanese characters, use character-based counting
  const japaneseChars = (totalText.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g) || []).length
  const japaneseRatio = japaneseChars / Math.max(totalChars, 1)

  let wordCount: number
  if (japaneseRatio > 0.3) {
    // Primarily Japanese text
    wordCount = totalChars / 2
  } else {
    // Primarily English/Latin text
    wordCount = totalText.split(/\s+/).filter(word => word.length > 0).length
  }

  // Calculate reading time (200 words per minute)
  const readingTime = Math.ceil(wordCount / 200)

  // Minimum 1 minute
  return Math.max(1, readingTime)
}

/**
 * Get reading time as formatted string
 */
export function getReadingTimeText(content: any, language: string = 'ja'): string {
  const minutes = calculateReadingTime(content)

  if (language === 'ja') {
    return `${minutes}分で読めます`
  }

  return `${minutes} min read`
}
