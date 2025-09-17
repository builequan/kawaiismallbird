'use client'
import React from 'react'
import Link from 'next/link'
import { Post } from '@/payload-types'
import { Media } from '@/components/Media'

interface PostCardProps {
  post: Post
  className?: string
}

export default function PostCard({ post, className = '' }: PostCardProps) {
  const href = `/posts/${post.slug}`
  
  // Get the first category for display
  const category = post.categories && Array.isArray(post.categories) && post.categories.length > 0
    ? typeof post.categories[0] === 'object' ? post.categories[0] : null
    : null

  // Try to get hero image first, then fall back to meta image
  const postImage = post.heroImage || post.meta?.image

  return (
    <Link href={href} className={`block group ${className}`}>
      <article className="h-full bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Image Container with fixed aspect ratio */}
        <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden">
          {postImage && typeof postImage === 'object' && postImage !== null ? (
            <Media 
              resource={postImage} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              imgClassName="w-full h-full object-cover"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
              <svg className="w-16 h-16 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Category Badge */}
          {category && (
            <div className="absolute top-3 left-3">
              <span className="inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {category.title}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-3 group-hover:text-green-600 transition-colors">
            {post.title}
          </h3>

          {/* Read More Link */}
          <div className="mt-3 flex items-center text-green-600 font-semibold text-xs">
            <span>続きを読む</span>
            <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  )
}