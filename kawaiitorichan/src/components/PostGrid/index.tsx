'use client'

import React from 'react'
import { ArticleCard } from '@/components/ArticleCard'
import { cn } from '@/utilities/ui'
import type { Post } from '@/payload-types'

interface PostGridProps {
  posts: Post[]
  title: string
  subtitle?: string
  className?: string
  columns?: 2 | 3 | 4
  showExcerpt?: boolean
  cardSize?: 'small' | 'medium' | 'large'
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts,
  title,
  subtitle,
  className,
  columns = 3,
  showExcerpt = true,
  cardSize = 'medium',
}) => {
  const gridClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className={cn('py-16', className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className={cn(
            'grid grid-cols-1 gap-8',
            gridClasses[columns]
          )}>
            {posts.map((post, index) => (
              <ArticleCard
                key={post.id}
                post={post}
                size={cardSize}
                showExcerpt={showExcerpt}
                colorIndex={index}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ記事がありません</h3>
            <p className="text-gray-600">新しい記事が公開されるまでお待ちください。</p>
          </div>
        )}
      </div>
    </section>
  )
}