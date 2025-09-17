'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/utilities/ui'
import type { Post, Category, Tag } from '@/payload-types'

interface ArticleCardProps {
  post: Post
  className?: string
  size?: 'small' | 'medium' | 'large'
  showExcerpt?: boolean
  colorIndex?: number
}

const pastelBackgrounds = [
  'bg-pastel-pink',
  'bg-pastel-mint', 
  'bg-pastel-blue',
  'bg-pastel-lavender',
  'bg-pastel-yellow',
]

const pastelHovers = [
  'hover:bg-pink-200',
  'hover:bg-emerald-200',
  'hover:bg-blue-200', 
  'hover:bg-purple-200',
  'hover:bg-yellow-200',
]

export const ArticleCard: React.FC<ArticleCardProps> = ({
  post,
  className,
  size = 'medium',
  showExcerpt = true,
  colorIndex = 0,
}) => {
  const backgroundClass = pastelBackgrounds[colorIndex % pastelBackgrounds.length]
  const hoverClass = pastelHovers[colorIndex % pastelHovers.length]
  
  const heroImage = typeof post.heroImage === 'object' ? post.heroImage : null
  const categories = Array.isArray(post.categories) 
    ? post.categories.filter((cat): cat is Category => typeof cat === 'object')
    : []
  const tags = Array.isArray(post.tags)
    ? post.tags.filter((tag): tag is Tag => typeof tag === 'object') 
    : []


  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6', 
    large: 'p-8',
  }

  const titleSizes = {
    small: 'text-lg font-semibold',
    medium: 'text-xl font-bold',
    large: 'text-2xl font-bold',
  }

  const imageSizes = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
  }

  return (
    <article className={cn(className)}>
      <Link href={`/posts/${post.slug}`}>
        <div className={cn(
          'rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg group',
          backgroundClass,
          hoverClass,
          sizeClasses[size]
        )}>
          {/* Featured Image */}
          {heroImage ? (
            <div className={cn('relative overflow-hidden rounded-xl mb-4', imageSizes[size])}>
              <Image
                src={heroImage.url || ''}
                alt={heroImage.alt || post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            // Fallback placeholder image for posts without hero images
            <div className={cn('relative overflow-hidden rounded-xl mb-4 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center', imageSizes[size])}>
              <div className="text-gray-400 text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">記事画像</span>
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.slice(0, 2).map((category) => (
                <span 
                  key={category.id}
                  className="inline-block px-3 py-1 text-xs font-medium bg-white/80 text-gray-700 rounded-full"
                >
                  {category.title}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className={cn(
            'text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-800 transition-colors',
            titleSizes[size]
          )}>
            {post.title}
          </h3>

          {/* Excerpt */}
          {showExcerpt && (
            <div className="text-gray-600 text-sm mb-4 line-clamp-3">
              {post.excerpt && typeof post.excerpt === 'object' && post.excerpt.root?.children?.[0]?.children?.[0]?.text
                ? post.excerpt.root.children[0].children[0].text
                : post.excerpt && typeof post.excerpt === 'string'
                ? post.excerpt
                : 'この記事の詳細な内容をご覧ください。'}
            </div>
          )}

          {/* Meta Information - Removed date, keeping only author if available */}
          {post.populatedAuthors && post.populatedAuthors.length > 0 && (
            <div className="flex items-center text-xs text-gray-500 mt-auto">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                {post.populatedAuthors[0].name}
              </span>
            </div>
          )}

          {/* Tags (if space allows) */}
          {tags.length > 0 && size !== 'small' && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag.id}
                  className="inline-block px-2 py-1 text-xs text-gray-600 bg-white/50 rounded-md"
                >
                  #{tag.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}