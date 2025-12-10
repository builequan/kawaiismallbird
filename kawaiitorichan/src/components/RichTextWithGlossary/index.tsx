'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { GlossaryTooltip, GlossaryProvider } from '@/components/GlossaryTooltip'

interface GlossaryTerm {
  id: number
  term: string
  reading: string
  definition: string
  source: string
  wikipediaUrl?: string
}

interface RichTextWithGlossaryProps {
  postId: string | number
  children: React.ReactNode
}

/**
 * Wraps RichText content and adds glossary tooltips to matching terms
 */
export default function RichTextWithGlossary({
  postId,
  children,
}: RichTextWithGlossaryProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Fetch glossary terms for this post
  useEffect(() => {
    async function fetchTerms() {
      try {
        const response = await fetch(`/api/glossary/terms?postId=${postId}`)
        if (response.ok) {
          const data = await response.json()
          setTerms(data.terms || [])
        }
      } catch (error) {
        console.error('Failed to fetch glossary terms:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchTerms()
  }, [postId])

  // Create a map for quick lookup
  const termMap = useMemo(() => {
    const map = new Map<string, GlossaryTerm>()
    for (const term of terms) {
      map.set(term.term, term)
    }
    return map
  }, [terms])

  // If no terms or not loaded, just render children
  if (!isLoaded || terms.length === 0) {
    return <>{children}</>
  }

  return (
    <GlossaryProvider terms={terms}>
      <GlossaryEnhancedContent terms={terms} termMap={termMap}>
        {children}
      </GlossaryEnhancedContent>
    </GlossaryProvider>
  )
}

interface GlossaryEnhancedContentProps {
  terms: GlossaryTerm[]
  termMap: Map<string, GlossaryTerm>
  children: React.ReactNode
}

function GlossaryEnhancedContent({
  terms,
  termMap,
  children,
}: GlossaryEnhancedContentProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [enhanced, setEnhanced] = useState(false)

  useEffect(() => {
    if (!containerRef.current || enhanced || terms.length === 0) return

    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length)

    // Create a regex pattern for all terms (with word boundaries for flexible matching)
    const termPatterns = sortedTerms.map(t => escapeRegExp(t.term))
    if (termPatterns.length === 0) return

    const regex = new RegExp(`(${termPatterns.join('|')})`, 'g')

    // Process text nodes in the container
    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip if parent is already a glossary term or is a link/code
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT

          const tagName = parent.tagName.toLowerCase()
          if (
            tagName === 'a' ||
            tagName === 'code' ||
            tagName === 'pre' ||
            tagName === 'script' ||
            tagName === 'style' ||
            parent.classList.contains('glossary-term')
          ) {
            return NodeFilter.FILTER_REJECT
          }

          return NodeFilter.FILTER_ACCEPT
        },
      }
    )

    const nodesToProcess: { node: Text; matches: RegExpMatchArray[] }[] = []

    // Collect all text nodes with matches
    let currentNode: Node | null
    while ((currentNode = walker.nextNode())) {
      const textNode = currentNode as Text
      const text = textNode.textContent || ''
      const matches = [...text.matchAll(regex)]

      if (matches.length > 0) {
        nodesToProcess.push({ node: textNode, matches })
      }
    }

    // Track which terms have been linked (only link first occurrence)
    const linkedTerms = new Set<string>()

    // Process nodes (in reverse to avoid invalidating references)
    for (let i = nodesToProcess.length - 1; i >= 0; i--) {
      const { node, matches } = nodesToProcess[i]
      const text = node.textContent || ''

      // Build new content with tooltips
      const fragment = document.createDocumentFragment()
      let lastIndex = 0

      for (const match of matches) {
        const matchedTerm = match[0]
        const matchIndex = match.index!

        // Only link first occurrence of each term
        if (linkedTerms.has(matchedTerm)) {
          continue
        }

        const term = termMap.get(matchedTerm)
        if (!term) continue

        linkedTerms.add(matchedTerm)

        // Add text before match
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)))
        }

        // Create tooltip wrapper
        const wrapper = document.createElement('span')
        wrapper.className = 'glossary-term-wrapper'
        wrapper.setAttribute('data-term', matchedTerm)
        wrapper.setAttribute('data-reading', term.reading)
        wrapper.setAttribute('data-definition', term.definition)
        wrapper.setAttribute('data-source', term.source)
        if (term.wikipediaUrl) {
          wrapper.setAttribute('data-wikipedia-url', term.wikipediaUrl)
        }

        // Style the term
        const termSpan = document.createElement('span')
        termSpan.className = 'glossary-term-text border-b border-dashed border-green-500 cursor-help text-green-700 hover:text-green-800 hover:border-green-700 transition-colors'
        termSpan.textContent = matchedTerm
        wrapper.appendChild(termSpan)

        fragment.appendChild(wrapper)
        lastIndex = matchIndex + matchedTerm.length
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
      }

      // Replace original node
      if (fragment.childNodes.length > 0) {
        node.parentNode?.replaceChild(fragment, node)
      }
    }

    // Add event listeners for tooltips
    const wrappers = containerRef.current.querySelectorAll('.glossary-term-wrapper')
    wrappers.forEach((wrapper) => {
      let tooltip: HTMLElement | null = null
      let hideTimeout: ReturnType<typeof setTimeout> | null = null
      let isHoveringTooltip = false

      const showTooltip = () => {
        // Clear any pending hide timeout
        if (hideTimeout) {
          clearTimeout(hideTimeout)
          hideTimeout = null
        }

        if (tooltip) return

        const term = wrapper.getAttribute('data-term') || ''
        const reading = wrapper.getAttribute('data-reading') || ''
        const definition = wrapper.getAttribute('data-definition') || ''
        const source = wrapper.getAttribute('data-source') || ''
        const wikipediaUrl = wrapper.getAttribute('data-wikipedia-url') || ''

        tooltip = document.createElement('div')
        tooltip.className = 'glossary-tooltip absolute z-50 w-72 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm'
        tooltip.style.cssText = 'left: 50%; transform: translateX(-50%); bottom: 100%; margin-bottom: 8px;'

        tooltip.innerHTML = `
          <div class="relative">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-gray-900">${escapeHtml(term)}</span>
              <span class="text-xs text-gray-500">(${escapeHtml(reading)})</span>
            </div>
            <p class="text-gray-700 text-xs leading-relaxed">${escapeHtml(definition)}</p>
            <div class="mt-2 flex items-center justify-between">
              ${source === 'wikipedia' && wikipediaUrl
                ? `<a href="${escapeHtml(wikipediaUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:underline">Wikipedia</a>`
                : '<span class="text-xs text-gray-400">AI生成</span>'
              }
              <a href="/glossary#term-${encodeURIComponent(term)}" class="text-xs text-green-600 hover:underline">用語集を見る</a>
            </div>
          </div>
        `

        // Add arrow
        const arrow = document.createElement('div')
        arrow.className = 'absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45'
        tooltip.appendChild(arrow)

        // Add event listeners to tooltip to keep it visible when hovering
        tooltip.addEventListener('mouseenter', () => {
          isHoveringTooltip = true
          if (hideTimeout) {
            clearTimeout(hideTimeout)
            hideTimeout = null
          }
        })

        tooltip.addEventListener('mouseleave', () => {
          isHoveringTooltip = false
          scheduleHide()
        })

        wrapper.classList.add('relative')
        wrapper.appendChild(tooltip)
      }

      const scheduleHide = () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout)
        }
        hideTimeout = setTimeout(() => {
          if (!isHoveringTooltip && tooltip) {
            tooltip.remove()
            tooltip = null
          }
        }, 150) // Small delay to allow moving to tooltip
      }

      const hideTooltip = () => {
        scheduleHide()
      }

      wrapper.addEventListener('mouseenter', showTooltip)
      wrapper.addEventListener('mouseleave', hideTooltip)
    })

    setEnhanced(true)
  }, [terms, termMap, enhanced])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

// Helper to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Helper to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
