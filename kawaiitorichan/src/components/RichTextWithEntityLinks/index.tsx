'use client'

import React, { useMemo } from 'react'
import { RichText } from '@/components/RichText'
import { applyEntityLinksToLexical } from '@/utilities/entityLinking'

interface RichTextWithEntityLinksProps {
  content: any
  className?: string
  currentPageSlug?: string
  enableEntityLinks?: boolean
  maxLinksPerEntity?: number
}

/**
 * RichText component with automatic entity linking
 * Automatically links bird species mentions to their entity pages
 * Based on Entity-Oriented Search principles (Chapter 5: Entity Linking)
 */
export function RichTextWithEntityLinks({
  content,
  className,
  currentPageSlug,
  enableEntityLinks = true,
  maxLinksPerEntity = 1,
}: RichTextWithEntityLinksProps) {
  // Apply entity links to content
  const processedContent = useMemo(() => {
    if (!enableEntityLinks || !content) {
      return content
    }

    try {
      return applyEntityLinksToLexical(content, {
        linkFirstMentionOnly: true,
        maxLinksPerEntity,
        currentPageSlug,
      })
    } catch (error) {
      console.error('Error applying entity links:', error)
      return content
    }
  }, [content, enableEntityLinks, maxLinksPerEntity, currentPageSlug])

  return <RichText content={processedContent} className={className} />
}

export default RichTextWithEntityLinks
