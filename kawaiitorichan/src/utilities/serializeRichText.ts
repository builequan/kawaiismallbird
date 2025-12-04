/**
 * Extract all text from Lexical richText content (no limit)
 * Used internally for word count and full text analysis
 */
function extractAllText(richText: any): string {
  if (!richText) return ''

  // Handle both Lexical format and plain text
  if (typeof richText === 'string') return richText

  if (!richText.root || !richText.root.children) return ''

  let plainText = ''

  const extractText = (node: any): void => {
    // Extract direct text content
    if (node.text) {
      plainText += node.text
    }

    // Add space after paragraphs
    if (node.type === 'paragraph' || node.type === 'heading') {
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => extractText(child))
      }
      plainText += ' '
    }
    // Handle list items
    else if (node.type === 'listitem') {
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => extractText(child))
      }
      plainText += ' '
    }
    // Add newlines for line breaks
    else if (node.type === 'linebreak') {
      plainText += ' '
    }
    // Recursively process children
    else if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => extractText(child))
    }
  }

  richText.root.children.forEach((node: any) => extractText(node))

  // Clean up: normalize whitespace, trim
  return plainText.replace(/\s+/g, ' ').trim()
}

/**
 * Serialize Lexical richText content to plain text
 * Used for meta descriptions and structured data
 * Limited to 500 chars for performance
 */
export function serializeRichTextToPlainText(richText: any): string {
  const fullText = extractAllText(richText)
  return fullText.substring(0, 500)
}

/**
 * Get full plain text content for word count calculation
 * No character limit applied
 */
export function serializeRichTextToFullText(richText: any): string {
  return extractAllText(richText)
}

/**
 * Serialize Lexical richText to excerpt text (shorter)
 * Ensures clean truncation at sentence or word boundaries
 */
export function serializeRichTextToExcerpt(richText: any, maxLength: number = 160): string {
  const plainText = serializeRichTextToPlainText(richText)

  if (!plainText || plainText.length === 0) return ''
  if (plainText.length <= maxLength) return plainText

  // Try to find a natural sentence break (。or .) within the limit
  const sentenceEnd = plainText.substring(0, maxLength).lastIndexOf('。')
  const periodEnd = plainText.substring(0, maxLength).lastIndexOf('.')
  const naturalBreak = Math.max(sentenceEnd, periodEnd)

  // If we found a sentence break after at least 60% of the max length, use it
  if (naturalBreak > maxLength * 0.6) {
    return plainText.substring(0, naturalBreak + 1)
  }

  // Otherwise, find last complete word before maxLength
  const truncated = plainText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  // For Japanese text, also consider common particles as break points
  const lastJapaneseBreak = Math.max(
    truncated.lastIndexOf('、'),
    truncated.lastIndexOf('は'),
    truncated.lastIndexOf('が'),
    truncated.lastIndexOf('を'),
    truncated.lastIndexOf('に'),
    truncated.lastIndexOf('で')
  )

  const breakPoint = Math.max(lastSpace, lastJapaneseBreak)

  if (breakPoint > maxLength * 0.7) {
    return truncated.substring(0, breakPoint) + '...'
  }

  return truncated + '...'
}
