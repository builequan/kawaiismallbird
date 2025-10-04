import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utilities/ui'

export interface BreadcrumbItem {
  name: string
  url?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb navigation component for SEO and UX
 * Renders visual breadcrumbs without JSON-LD (handled separately by StructuredData component)
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm text-gray-600', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            )}
            {isLast || !item.url ? (
              <span className="font-medium text-gray-900" aria-current={isLast ? 'page' : undefined}>
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="hover:text-green-600 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
