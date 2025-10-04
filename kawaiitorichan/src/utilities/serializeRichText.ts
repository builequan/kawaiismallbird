/**
 * Serialize Lexical richText content to plain text
 * Used for meta descriptions and structured data
 */
export function serializeRichTextToPlainText(richText: any): string {
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
  return plainText
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500) // Limit to 500 chars for descriptions
}

/**
 * Serialize Lexical richText to excerpt text (shorter)
 */
export function serializeRichTextToExcerpt(richText: any, maxLength: number = 160): string {
  const plainText = serializeRichTextToPlainText(richText)

  if (plainText.length <= maxLength) return plainText

  // Find last complete word before maxLength
  const truncated = plainText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}
