'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Eye, Heart } from 'lucide-react'
import type { Post } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

interface MobileArticleCardsProps {
  posts: Post[]
  title: string
  showViewAll?: boolean
}

export const MobileArticleCards: React.FC<MobileArticleCardsProps> = ({
  posts,
  title,
  showViewAll = true
}) => {
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric'
    })
  }

  return (
    <section className="py-8 md:py-12 px-4 md:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          {showViewAll && (
            <Link
              href="/posts"
              className="text-sm md:text-base text-amber-600 font-medium hover:text-amber-700"
            >
              すべて見る →
            </Link>
          )}
        </div>

        {/* Mobile-Optimized Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {posts.map((post, index) => {
            const heroImageUrl = post.heroImage
              ? getMediaUrl(post.heroImage)
              : '/birdimage/download.webp'

            return (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block touch-manipulation"
              >
                <article className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Mobile: Horizontal Layout, Desktop: Vertical */}
                  <div className="flex md:block">
                    {/* Image */}
                    <div className="relative w-32 h-32 md:w-full md:h-48 flex-shrink-0">
                      <Image
                        src={heroImageUrl}
                        alt={post.heroImageAlt || post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, (max-width: 1024px) 50vw, 33vw"
                        priority={index === 0}
                      />
                      {/* Category Badge - Desktop Only */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="hidden md:block absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
                          {typeof post.categories[0] !== 'string' && post.categories[0].title}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-5">
                      {/* Category - Mobile Only */}
                      {post.categories && post.categories.length > 0 && (
                        <span className="md:hidden text-xs font-semibold text-amber-600 mb-1 block">
                          {typeof post.categories[0] !== 'string' && post.categories[0].title}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors">
                        {post.title}
                      </h3>

                      {/* Excerpt - Hidden on Mobile */}
                      {post.excerpt && (
                        <p className="hidden md:block text-sm text-gray-600 line-clamp-2 mb-3">
                          {typeof post.excerpt === 'string'
                            ? post.excerpt
                            : post.excerpt?.root?.children?.[0]?.children?.[0]?.text || ''}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            123
                          </span>
                        </div>
                        <Heart className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* Load More Button - Mobile */}
        <div className="mt-8 text-center md:hidden">
          <button className="px-6 py-3 bg-amber-500 text-white rounded-full font-medium shadow-lg active:scale-95 transition-transform">
            もっと見る
          </button>
        </div>
      </div>
    </section>
  )
}