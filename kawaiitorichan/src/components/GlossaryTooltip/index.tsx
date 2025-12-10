'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface GlossaryTerm {
  term: string
  reading: string
  definition: string
  source?: string
  wikipediaUrl?: string
}

interface GlossaryTooltipProps {
  term: GlossaryTerm
  children: React.ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom

      // If less than 200px above, show below
      setPosition(spaceAbove < 200 ? 'bottom' : 'top')
    }
  }, [isVisible])

  return (
    <span
      ref={triggerRef}
      className="glossary-term relative inline"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="border-b border-dashed border-green-500 cursor-help text-green-700 hover:text-green-800 hover:border-green-700 transition-colors">
        {children}
      </span>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-72 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
            animate-in fade-in-0 zoom-in-95 duration-200
          `}
          style={{
            maxWidth: 'calc(100vw - 2rem)',
          }}
        >
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-gray-200 rotate-45
              ${position === 'top' ? 'bottom-0 translate-y-1/2 border-r border-b' : 'top-0 -translate-y-1/2 border-l border-t'}
            `}
          />

          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900">{term.term}</span>
              <span className="text-xs text-gray-500">({term.reading})</span>
            </div>

            <p className="text-gray-700 text-xs leading-relaxed">
              {term.definition}
            </p>

            <div className="mt-2 flex items-center justify-between">
              {term.source === 'wikipedia' && term.wikipediaUrl ? (
                <a
                  href={term.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Wikipedia
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="text-xs text-gray-400">AI生成</span>
              )}

              <Link
                href={`/glossary#term-${term.term}`}
                className="text-xs text-green-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                用語集を見る
              </Link>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}

interface GlossaryContextValue {
  terms: Map<string, GlossaryTerm>
}

const GlossaryContext = React.createContext<GlossaryContextValue>({
  terms: new Map(),
})

export function GlossaryProvider({
  terms,
  children,
}: {
  terms: GlossaryTerm[]
  children: React.ReactNode
}) {
  const termMap = new Map<string, GlossaryTerm>()
  for (const term of terms) {
    termMap.set(term.term, term)
  }

  return (
    <GlossaryContext.Provider value={{ terms: termMap }}>
      {children}
    </GlossaryContext.Provider>
  )
}

export function useGlossary() {
  return React.useContext(GlossaryContext)
}

export default GlossaryTooltip
