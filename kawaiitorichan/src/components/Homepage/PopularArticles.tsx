'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Eye, Heart, Award, Flame } from 'lucide-react'
import type { Post } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { fixMediaUrl } from '@/utilities/fixMediaUrl'

interface PopularArticlesProps {
  posts: Post[]
}

export const PopularArticles: React.FC<PopularArticlesProps> = ({ posts }) => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg animate-pulse">
                <Flame className="w-6 h-6 text-white" />
              </div>
              人気の記事
            </h2>
            <p className="text-gray-600 mt-2 ml-16">みんなが読んでいる話題の記事</p>
          </div>
        </div>

        {/* Popular Articles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Article - Featured Large */}
          {posts[0] && (
            <div className="lg:col-span-2">
              <Link href={`/posts/${posts[0].slug}`} className="group">
                <article className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Side */}
                    <div className="relative h-64 md:h-96 overflow-hidden">
                      <Image
                        src={(() => {
                          let url = '/birdimage/download.webp'
                          if (posts[0].hero && typeof posts[0].hero === 'object' && 'url' in posts[0].hero) {
                            url = fixMediaUrl(posts[0].hero.url)
                          } else if (posts[0].content) {
                            try {
                              if (typeof posts[0].content === 'object' && posts[0].content.root) {
                                const findFirstImage = (node: any): string | null => {
                                  if (node.type === 'upload' && node.value) {
                                    if (typeof node.value === 'object') {
                                      if ('url' in node.value) {
                                        return node.value.url
                                      } else if ('filename' in node.value) {
                                        return `/media/${node.value.filename}`
                                      }
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
                                const firstImage = findFirstImage(posts[0].content.root)
                                if (firstImage) {
                                  url = fixMediaUrl(firstImage)
                                }
                              }
                            } catch (e) {
                              console.error('Error extracting image:', e)
                            }
                          }
                          return url
                        })()}
                        alt={posts[0].title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />

                      {/* Ranking Badge */}
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-center">
                          <Award className="w-6 h-6 mb-1" />
                          <span className="text-xs font-bold">#1</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-xs font-bold">
                          MOST POPULAR
                        </span>
                        {posts[0].categories && posts[0].categories.length > 0 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {typeof posts[0].categories[0] !== 'string' && posts[0].categories[0].title}
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors duration-300">
                        {posts[0].title}
                      </h3>

                      {posts[0].excerpt && (
                        <p className="text-gray-600 mb-6 line-clamp-3">
                          {typeof posts[0].excerpt === 'string'
                            ? posts[0].excerpt
                            : posts[0].excerpt?.root?.children?.[0]?.children?.[0]?.text || ''}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Eye className="w-4 h-4" />
                            <span className="font-semibold">5.2k</span>
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Heart className="w-4 h-4" />
                            <span className="font-semibold">342</span>
                          </span>
                        </div>

                        <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700 transition-colors flex items-center gap-1">
                          続きを読む →
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          )}

          {/* Other Popular Articles */}
          {posts.slice(1, 5).map((post, index) => {
            // Extract hero image from post
            let heroImageUrl = '/birdimage/download.webp'

            if (post.hero && typeof post.hero === 'object' && 'url' in post.hero) {
              heroImageUrl = fixMediaUrl(post.hero.url)
            } else if (post.hero && typeof post.hero === 'string') {
              heroImageUrl = post.hero
            } else if (post.content) {
              try {
                if (typeof post.content === 'object' && post.content.root) {
                  const findFirstImage = (node: any): string | null => {
                    if (node.type === 'upload' && node.value) {
                      if (typeof node.value === 'object') {
                        if ('url' in node.value) {
                          return node.value.url
                        } else if ('filename' in node.value) {
                          return `/media/${node.value.filename}`
                        }
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
                className="group"
              >
                <article className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                  <div className="flex">
                    {/* Ranking Number */}
                    <div className="flex-shrink-0 w-14 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center rounded-l-2xl">
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                        #{index + 2}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative w-40 h-32 flex-shrink-0 overflow-hidden">
                      <Image
                        src={heroImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="160px"
                        priority={index === 0}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      {post.categories && post.categories.length > 0 && (
                        <span className="text-xs font-semibold text-orange-600 mb-1 block">
                          {typeof post.categories[0] !== 'string' && post.categories[0].title}
                        </span>
                      )}

                      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                        {post.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{(4800 - index * 800).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{280 - index * 50}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 font-semibold">+{15 - index * 3}%</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* See More Popular */}
        <div className="mt-10 text-center">
          <Link
            href="/posts?sort=popular"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium transform hover:scale-105"
          >
            <TrendingUp className="w-5 h-5" />
            もっと人気記事を見る
          </Link>
        </div>
      </div>
    </section>
  )
}