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

  // Use payload to fetch related posts
  const payload = await getPayload({ config: configPromise })

  let relatedPosts: any[] = []
  let sectionTitle = "関連記事"
  let sectionSubtitle = "こちらの記事もおすすめです"

  // First try to get similar posts if available
  if (similarPosts && similarPosts.length > 0) {
    // Get top 3 most similar posts (excluding those with low scores) for 3-column layout
    const topSimilar = similarPosts
      .filter(post => post.score >= 0.65) // Only show reasonably similar posts
      .slice(0, 3)

    if (topSimilar.length > 0) {
      // Fetch the actual post data for the similar posts
      const { docs: similarPostsData } = await payload.find({
        collection: 'posts',
        where: {
          id: {
            in: topSimilar.map(p => typeof p.id === 'string' ? parseInt(p.id) : p.id)
          },
          _status: {
            equals: 'published'
          }
        },
        limit: 3,
        depth: 2 // Need depth to populate heroImage and categories
      })

      if (similarPostsData && similarPostsData.length > 0) {
        // Sort posts by similarity score
        relatedPosts = similarPostsData.sort((a, b) => {
          const scoreA = topSimilar.find(s => s.id == a.id)?.score || 0
          const scoreB = topSimilar.find(s => s.id == b.id)?.score || 0
          return scoreB - scoreA
        })
      }
    }
  }

  // Fallback: Get recent posts if no similar posts found
  if (relatedPosts.length === 0) {
    // First try to get current post to get its categories
    const { docs: currentPostData } = await payload.find({
      collection: 'posts',
      where: {
        id: { equals: currentPostId },
        _status: { equals: 'published' }
      },
      limit: 1,
      depth: 2
    })

    const currentPost = currentPostData?.[0]
    let fallbackQuery: any = {
      id: { not_equals: currentPostId },
      _status: { equals: 'published' }
    }

    // If current post has categories, try to get posts from same categories first
    if (currentPost?.categories && Array.isArray(currentPost.categories) && currentPost.categories.length > 0) {
      const categoryIds = currentPost.categories
        .filter(cat => typeof cat === 'object' && cat !== null)
        .map(cat => cat.id)

      if (categoryIds.length > 0) {
        fallbackQuery.categories = { in: categoryIds }
        sectionTitle = "同じカテゴリの記事"
        sectionSubtitle = "関連する他の記事もチェック"
      }
    }

    const { docs: fallbackPosts } = await payload.find({
      collection: 'posts',
      where: fallbackQuery,
      limit: 3,
      depth: 2,
      sort: '-publishedAt' // Get recent posts
    })

    if (fallbackPosts && fallbackPosts.length > 0) {
      relatedPosts = fallbackPosts
    } else {
      // Last fallback: any recent posts excluding current
      const { docs: anyRecentPosts } = await payload.find({
        collection: 'posts',
        where: {
          id: { not_equals: currentPostId },
          _status: { equals: 'published' }
        },
        limit: 3,
        depth: 2,
        sort: '-publishedAt'
      })

      if (anyRecentPosts && anyRecentPosts.length > 0) {
        relatedPosts = anyRecentPosts
        sectionTitle = "最新記事"
        sectionSubtitle = "新しい記事をチェック"
      }
    }
  }

  // If still no posts found, don't render anything
  if (!relatedPosts || relatedPosts.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      {/* Section with light background similar to homepage */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {sectionTitle}
            </h2>
            <p className="text-gray-600 text-lg">
              {sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {relatedPosts.map((post) => (
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