import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []

  // Always show first page
  pages.push(1)

  // Show pages around current page
  if (currentPage > 3) {
    pages.push('...')
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // Show ellipsis and last page
  if (currentPage < totalPages - 2) {
    pages.push('...')
  }

  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages)
  }

  const getPageUrl = (page: number) => {
    if (page === 1) return basePath
    return `${basePath}?page=${page}`
  }

  return (
    <nav className="flex items-center justify-center gap-2 my-12" aria-label="ページネーション">
      {/* Previous Page */}
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors min-h-[44px]"
          aria-label="前のページ"
        >
          <ChevronLeft className="w-4 h-4" />
          前へ
        </Link>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <Link
              key={pageNum}
              href={getPageUrl(pageNum)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-primary'
              }`}
              aria-label={`ページ ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          )
        })}
      </div>

      {/* Next Page */}
      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors min-h-[44px]"
          aria-label="次のページ"
        >
          次へ
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </nav>
  )
}
