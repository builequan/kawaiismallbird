'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, Eye, Heart } from 'lucide-react'
import type { Post } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

interface ArticleCarouselProps {
  posts: Post[]
}

export const ArticleCarousel: React.FC<ArticleCarouselProps> = ({ posts }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 3) return

    const interval = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, isAutoPlaying, posts.length])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, posts.length - 2))
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + (posts.length - 2)) % Math.max(1, posts.length - 2))
  }

  const visiblePosts = posts.slice(currentIndex, currentIndex + 3)

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const day = d.getDate()
    const year = d.getFullYear()
    return { month, day, year }
  }

  if (posts.length === 0) {
    return (
      <div className="w-full py-16 text-center">
        <p className="text-gray-500">記事がありません</p>
      </div>
    )
  }

  return (
    <div className="relative w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
              Featured Articles
            </h2>
            <p className="text-gray-600 mt-2">最新の特集記事をチェック</p>
          </div>

          {/* Navigation Buttons for Desktop */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => {
                handlePrev()
                setIsAutoPlaying(false)
              }}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 group"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 group-hover:text-amber-600 transition-colors" />
            </button>
            <button
              onClick={() => {
                handleNext()
                setIsAutoPlaying(false)
              }}
              className="p-3 rounded-full bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110 group"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-amber-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Cards Container */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {visiblePosts.map((post, index) => {
            const date = formatDate(post.publishedAt || new Date())
            const heroImageUrl = post.heroImage
              ? getMediaUrl(post.heroImage)
              : '/birdimage/download.webp'

            return (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block"
              >
                <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-56 md:h-64 overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50">
                    <Image
                      src={heroImageUrl}
                      alt={post.heroImageAlt || post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index === 0}
                    />

                    {/* Category Badge */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {typeof post.categories[0] !== 'string' && post.categories[0].title}
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <div className="text-gray-600 line-clamp-3 mb-4">
                        {typeof post.excerpt === 'string'
                          ? post.excerpt
                          : post.excerpt?.root?.children?.[0]?.children?.[0]?.text || ''}
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>1.2k</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>89</span>
                        </span>
                      </div>

                      <span className="text-sm font-medium text-amber-600 group-hover:text-amber-700 transition-colors">
                        続きを読む →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* Mobile Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8 md:hidden">
          {Array.from({ length: Math.max(1, posts.length - 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-amber-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}