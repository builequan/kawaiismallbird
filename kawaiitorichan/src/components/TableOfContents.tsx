'use client'

import React, { useMemo, useState } from 'react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: any
  className?: string
}

export default function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Extract headings from Lexical content
  const tocItems = useMemo(() => {
    if (!content || !content.root || !content.root.children) {
      return []
    }

    const items: TOCItem[] = []
    let headingCounter = 0

    function extractHeadings(children: any[]) {
      children.forEach((child) => {
        if (child.type === 'heading') {
          const text = extractTextFromNode(child)
          if (text && text.trim()) {
            // Skip reference sections
            if (
              text.includes('出典') ||
              text.includes('参考文献') ||
              text.includes('References') ||
              text.includes('参考資料')
            ) {
              return
            }

            const level = parseInt(child.tag?.replace('h', '') || '1')
            const id = `heading-${++headingCounter}`

            items.push({
              id,
              text: text.trim(),
              level
            })
          }
        }

        // Recursively check children if they exist
        if (child.children && Array.isArray(child.children)) {
          extractHeadings(child.children)
        }
      })
    }

    extractHeadings(content.root.children)
    return items
  }, [content])

  function extractTextFromNode(node: any): string {
    if (!node) return ''
    // Skip link nodes - headings with links should not be in TOC
    if (node.type === 'link') return ''
    if (node.type === 'text') return node.text || ''
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractTextFromNode).join('')
    }
    return ''
  }

  // Don't render if no headings found
  if (tocItems.length === 0) {
    return null
  }

  const handleHeadingClick = (id: string, text: string) => {
    // Find the heading element by text content since we can't add IDs to Lexical output
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const targetHeading = Array.from(headings).find(h =>
      h.textContent?.trim() === text.trim()
    )

    if (targetHeading) {
      targetHeading.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      // Close TOC on mobile after click
      if (window.innerWidth < 1024) {
        setIsOpen(false)
      }
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header with toggle */}
      <div
        className="px-4 py-3 border-b border-gray-200 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          目次
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* TOC Content */}
      {isOpen && (
        <nav className="p-4">
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleHeadingClick(item.id, item.text)}
                  className={`
                    block w-full text-left px-2 py-1 text-sm rounded hover:bg-green-50 hover:text-green-700 transition-colors
                    ${item.level === 1 ? 'font-medium text-gray-900' : ''}
                    ${item.level === 2 ? 'text-gray-700 ml-3' : ''}
                    ${item.level === 3 ? 'text-gray-600 ml-6' : ''}
                    ${item.level >= 4 ? 'text-gray-500 ml-9' : ''}
                  `}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}