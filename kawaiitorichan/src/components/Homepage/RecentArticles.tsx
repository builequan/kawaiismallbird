'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ArrowRight, TrendingUp } from 'lucide-react'
import type { Post } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { fixMediaUrl } from '@/utilities/fixMediaUrl'

interface RecentArticlesProps {
  posts: Post[]
}

export const RecentArticles: React.FC<RecentArticlesProps> = ({ posts }) => {
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              最新の記事
            </h2>
            <p className="text-gray-600 mt-2 ml-16">新しく公開された記事をご覧ください</p>
          </div>

          <Link
            href="/posts"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md hover:shadow-xl transition-all duration-300 group"
          >
            <span className="font-medium text-gray-700 group-hover:text-amber-600">すべての記事</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Articles Grid - 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.slice(0, 8).map((post, index) => {
            // Try to get hero image from post.hero field
            let heroImageUrl = '/birdimage/download.webp' // default image

            if (post.hero && typeof post.hero === 'object' && 'url' in post.hero) {
              heroImageUrl = post.hero.url
            } else if (post.hero && typeof post.hero === 'string') {
              heroImageUrl = post.hero
            } else if (post.content) {
              // Try to extract first image from content if no hero image
              try {
                if (typeof post.content === 'object' && post.content.root) {
                  const findFirstImage = (node: any): string | null => {
                    // Check if this node is an upload (image)
                    if (node.type === 'upload' && node.value) {
                      if (typeof node.value === 'object' && node.value.url) {
                        return node.value.url
                      }
                    }
                    // Recursively search children
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
                console.error('Error extracting image from content:', e)
              }
            }

            return (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group"
              >
                <article className="h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Image Container - Square aspect ratio for grid */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50">
                    <Image
                      src={heroImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* New Badge for recent posts */}
                    {index === 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        NEW
                      </div>
                    )}

                    {/* Category Badge */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-md">
                        {typeof post.categories[0] !== 'string' && post.categories[0].title}
                      </div>
                    )}
                  </div>

                  {/* Content - Simplified for grid layout */}
                  <div className="p-4">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300 min-h-[2.5rem]">
                      {post.title}
                    </h3>

                    {/* Date - Compact display */}
                    <div className="flex items-center justify-between">
                      <time className="text-xs text-gray-500">
                        {formatDate(post.publishedAt || new Date())}
                      </time>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            すべての記事を見る
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}