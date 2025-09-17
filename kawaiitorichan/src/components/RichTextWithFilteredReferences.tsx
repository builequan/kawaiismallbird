'use client'

import React, { useMemo } from 'react'
import RichText from '@/components/RichText/SafeRichText'

interface RichTextWithFilteredReferencesProps {
  content: any
  className?: string
}

export default function RichTextWithFilteredReferences({ content, className }: RichTextWithFilteredReferencesProps) {
  // Filter out reference section from content
  const filteredContent = useMemo(() => {
    if (!content || !content.root || !content.root.children) {
      return content
    }

    let referenceStartIndex = -1

    // Go through all children from the end to find references section
    for (let i = content.root.children.length - 1; i >= 0; i--) {
      const child = content.root.children[i]

      // Check if this is a references heading
      if (child.type === 'heading') {
        const headingText = extractTextFromNode(child)

        // Look for reference section markers
        if (headingText && (
          headingText.includes('出典') ||
          headingText.includes('参考文献') ||
          headingText.includes('参考資料') ||
          headingText.includes('References')
        )) {
          // Found a reference heading, check if it's the last reference heading
          referenceStartIndex = i
          // Keep looking backwards to find the first reference heading
          for (let j = i - 1; j >= 0; j--) {
            const prevChild = content.root.children[j]
            if (prevChild.type === 'heading') {
              const prevHeadingText = extractTextFromNode(prevChild)
              if (prevHeadingText && (
                prevHeadingText.includes('出典') ||
                prevHeadingText.includes('参考文献') ||
                prevHeadingText.includes('参考資料') ||
                prevHeadingText.includes('References')
              )) {
                referenceStartIndex = j
              } else {
                // Found a non-reference heading, stop
                break
              }
            }
          }
          break
        }
      }
    }

    // If no reference section found, return original content
    if (referenceStartIndex === -1) {
      return content
    }

    // Create a new content object without the reference section
    return {
      ...content,
      root: {
        ...content.root,
        children: content.root.children.slice(0, referenceStartIndex)
      }
    }

    function extractTextFromNode(node: any): string {
      if (!node) return ''
      if (node.type === 'text') return node.text || ''
      if (node.children && Array.isArray(node.children)) {
        return node.children.map(extractTextFromNode).join('')
      }
      return ''
    }
  }, [content])

  // Use data prop for RichText component
  return <RichText data={filteredContent} className={className} enableGutter={false} />
}