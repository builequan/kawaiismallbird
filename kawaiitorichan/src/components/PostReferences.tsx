'use client'

import React, { useMemo } from 'react'
import { SimpleCollapsibleReferences } from './CollapsibleReferences'

interface PostReferencesProps {
  content: any // Lexical content
}

// Extract references from Lexical content and get their indices
function extractReferencesWithIndices(content: any): { references: string[], startIndex: number } {
  const references: string[] = []
  let startIndex = -1

  if (!content || !content.root || !content.root.children) {
    return { references, startIndex }
  }

  let foundReferencesHeading = false

  // Go through all children to find the references section
  for (let i = 0; i < content.root.children.length; i++) {
    const child = content.root.children[i]

    // Check if this is a references heading
    if (child.type === 'heading') {
      const headingText = extractTextFromNode(child)

      // Look for reference section markers - be very specific
      if (headingText && (
        headingText === '出典・参考文献' ||
        headingText === '出典・参考文献出典・参考文献' ||  // Handle duplicated text
        headingText === '参考文献' ||
        headingText === '参考文献参考文献' ||
        headingText === '出典および参考文献' ||
        headingText === '出典および参考文献出典および参考文献' ||
        headingText === 'References' ||
        (headingText.startsWith('出典') && i > content.root.children.length * 0.7) // Only if in last 30% of content
      )) {
        foundReferencesHeading = true
        startIndex = i
        // Don't add the heading itself to references, just mark the start
        continue
      }
    }

    // If we've found the references section, collect all content after it
    if (foundReferencesHeading) {
      if (child.type === 'list' && child.children) {
        // Process list items
        child.children.forEach((listItem: any) => {
          if (listItem.type === 'listitem') {
            const text = extractTextFromNode(listItem)
            if (text && text.trim()) {
              references.push(text.trim())
            }
          }
        })
      } else if (child.type === 'paragraph') {
        // Also include paragraphs that might be part of references
        const text = extractTextFromNode(child)
        if (text && text.trim() && (text.includes('http') || text.includes('リンク'))) {
          references.push(text.trim())
        }
      }
    }
  }

  // Helper to extract plain text from a node
  function extractTextFromNode(node: any): string {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractTextFromNode).join('')
    }
    return ''
  }

  // Clean up references - remove numbering if present
  const cleanedReferences = references.map(ref => {
    // Remove leading numbers like "1. " or "1) "
    return ref.replace(/^\d+[\.\)]\s*/, '').trim()
  })

  // Remove duplicates and empty strings
  const uniqueReferences = [...new Set(cleanedReferences)].filter(ref => ref && ref.trim().length > 0)

  return { references: uniqueReferences, startIndex }
}

export default function PostReferences({ content }: PostReferencesProps) {
  const { references, startIndex } = useMemo(() => extractReferencesWithIndices(content), [content])

  // Only show if we have actual references
  if (references.length === 0 || startIndex === -1) {
    return null
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <SimpleCollapsibleReferences
        references={references}
        title="参考文献・出典"
      />
    </div>
  )
}

// Export the startIndex finder for use in RichText component
export function findReferenceSectionStart(content: any): number {
  if (!content || !content.root || !content.root.children) {
    return -1
  }

  for (let i = 0; i < content.root.children.length; i++) {
    const child = content.root.children[i]

    if (child.type === 'heading') {
      const headingText = extractTextFromNode(child)

      // Be very specific about reference headings
      if (headingText && (
        headingText === '出典・参考文献' ||
        headingText === '出典・参考文献出典・参考文献' ||  // Handle duplicated text
        headingText === '参考文献' ||
        headingText === '参考文献参考文献' ||
        headingText === '出典および参考文献' ||
        headingText === '出典および参考文献出典および参考文献' ||
        headingText === 'References' ||
        (headingText.startsWith('出典') && i > content.root.children.length * 0.7) // Only if in last 30% of content
      )) {
        return i
      }
    }
  }

  return -1

  function extractTextFromNode(node: any): string {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractTextFromNode).join('')
    }
    return ''
  }
}