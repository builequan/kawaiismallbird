'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Eye } from 'lucide-react'
import type { Post } from '@/payload-types'
import { fixMediaUrl } from '@/utilities/fixMediaUrl'

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

        {/* 4-Column Grid with Hero Images */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {posts.slice(0, 8).map((post, index) => {
            // Extract hero image from various possible sources
            let heroImageUrl = '/birdimage/download.webp' // default

            // Try post.hero field first
            if (post.hero && typeof post.hero === 'object' && 'url' in post.hero) {
              heroImageUrl = post.hero.url
            } else if (post.hero && typeof post.hero === 'string') {
              heroImageUrl = post.hero
            } else if (post.content) {
              // Extract first image from content
              try {
                if (typeof post.content === 'object' && post.content.root) {
                  const findFirstImage = (node: any): string | null => {
                    if (node.type === 'upload' && node.value) {
                      if (typeof node.value === 'object' && node.value.url) {
                        return node.value.url
                      }
                    }
                    if (node.children && Array.isArray(node.children)) {
                      for (const child of node.children) {
                        const result = findFirstImage(child)
                        if (result) return result
                      }
                    }
                    return null
                  }
                  const firstImage = findFirstImage(post.content.root)
                  if (firstImage) {
                    heroImageUrl = fixMediaUrl(firstImage)
                  }
                }
              } catch (e) {
                console.error('Error extracting image:', e)
              }
            }

            return (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group block"
              >
                <article className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  {/* Vertical Layout for Grid */}
                  <div className="block">
                    {/* Hero Image - Square aspect ratio */}
                    <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-yellow-50">
                      <Image
                        src={heroImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 33vw, 25vw"
                        priority={index < 4}
                      />
                      {/* NEW Badge for first post */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                          NEW
                        </div>
                      )}
                      {/* Category Badge */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                          {typeof post.categories[0] !== 'string' && post.categories[0].title}
                        </div>
                      )}
                    </div>

                    {/* Content - Compact */}
                    <div className="p-3 md:p-4">
                      {/* Title */}
                      <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
                        {post.title}
                      </h3>

                      {/* Date */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.publishedAt || new Date())}
                        </span>
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