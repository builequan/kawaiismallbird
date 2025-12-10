'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { extractMentionedEntities, birdEntityDictionary } from '@/utilities/entityLinking'
import { serializeRichTextToPlainText } from '@/utilities/serializeRichText'

interface RelatedEntitiesProps {
  content: any
  className?: string
  title?: string
  excludeSlug?: string
}

/**
 * Shows bird species mentioned in the article content
 * Based on Entity-Oriented Search principles for entity discovery
 */
export function RelatedEntities({
  content,
  className = '',
  title = '記事で紹介している鳥',
  excludeSlug,
}: RelatedEntitiesProps) {
  const mentionedEntities = useMemo(() => {
    if (!content) return []

    try {
      const plainText = serializeRichTextToPlainText(content)
      const entities = extractMentionedEntities(plainText)

      // Filter out the current page entity if specified
      return entities.filter(entity => entity.slug !== excludeSlug)
    } catch (error) {
      console.error('Error extracting mentioned entities:', error)
      return []
    }
  }, [content, excludeSlug])

  if (mentionedEntities.length === 0) {
    return null
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
        <span className="text-lg">🐦</span>
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {mentionedEntities.map(entity => (
          <Link
            key={entity.slug}
            href={`/birds/${entity.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-green-300 rounded-full text-sm text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors"
          >
            {entity.canonicalName}
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedEntities
