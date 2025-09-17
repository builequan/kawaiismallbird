import React from 'react'
import { Post } from '@/payload-types'
import PostCard from '@/components/PostCard'
import { getCachedPayload } from '@/lib/payload-singleton'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface SemanticRelatedPostsProps {
  currentPostId: number
  similarPosts?: Array<{
    id: string | number
    slug: string
    score: number
  }>
  className?: string
}

// Component to fetch and display related posts based on similarity scores
export default async function SemanticRelatedPosts({ 
  currentPostId, 
  similarPosts,
  className = '' 
}: SemanticRelatedPostsProps) {
  
  if (!similarPosts || similarPosts.length === 0) {
    return null
  }

  // Use payload to fetch related posts
  const payload = await getPayload({ config: configPromise })

  // Get top 4 most similar posts (excluding those with low scores)
  const topSimilar = similarPosts
    .filter(post => post.score >= 0.65) // Only show reasonably similar posts
    .slice(0, 4)

  if (topSimilar.length === 0) {
    return null
  }

  // Fetch the actual post data for the similar posts
  const { docs: relatedPosts } = await payload.find({
    collection: 'posts',
    where: {
      id: {
        in: topSimilar.map(p => typeof p.id === 'string' ? parseInt(p.id) : p.id)
      },
      _status: {
        equals: 'published'
      }
    },
    limit: 4,
    depth: 2 // Need depth to populate heroImage and categories
  })

  if (!relatedPosts || relatedPosts.length === 0) {
    return null
  }

  // Sort posts by similarity score
  const sortedPosts = relatedPosts.sort((a, b) => {
    const scoreA = topSimilar.find(s => s.id == a.id)?.score || 0
    const scoreB = topSimilar.find(s => s.id == b.id)?.score || 0
    return scoreB - scoreA
  })

  return (
    <div className={`${className}`}>
      {/* Section with light background similar to homepage */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              関連記事
            </h2>
            <p className="text-gray-600 text-lg">
              こちらの記事もおすすめです
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedPosts.map((post) => (
              <PostCard 
                key={post.id}
                post={post}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}