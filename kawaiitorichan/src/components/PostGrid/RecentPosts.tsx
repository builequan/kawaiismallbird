'use client'

import React, { useEffect, useState } from 'react'
import { PostGrid } from './index'
import type { Post } from '@/payload-types'

interface RecentPostsProps {
  className?: string
  limit?: number
}

export const RecentPosts: React.FC<RecentPostsProps> = ({
  className,
  limit = 6,
}) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch(`/api/posts?limit=${limit}&sort=-publishedAt&where[_status][equals]=published&populate=heroImage,excerpt,categories,tags`)
        const data = await response.json()
        
        if (data.docs) {
          setPosts(data.docs)
        }
      } catch (error) {
        console.error('Error fetching recent posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentPosts()
  }, [limit])

  if (loading) {
    return (
      <section className={className}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-lg mb-4 max-w-md mx-auto animate-pulse" />
            <div className="h-6 bg-gray-100 rounded-lg max-w-xl mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-80" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <PostGrid
      posts={posts}
      title="最新記事"
      subtitle="最近公開された新しい記事をお読みください"
      className={className}
      columns={3}
      cardSize="medium"
      showExcerpt={true}
    />
  )
}