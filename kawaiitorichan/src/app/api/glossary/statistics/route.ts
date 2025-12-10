import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get glossary statistics
    const glossary = await payload.find({
      collection: 'glossary',
      limit: 10000,
      pagination: false,
    })

    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      limit: 10000,
      pagination: false,
      select: {
        id: true,
      },
    })

    // Count by source
    const bySource = {
      wikipedia: 0,
      llm: 0,
    }

    // Count by category
    const byCategory: Record<string, number> = {}

    // Track which posts have glossary terms
    const postsWithTerms = new Set<number>()

    for (const entry of glossary.docs) {
      // Count by source
      if (entry.source === 'wikipedia') {
        bySource.wikipedia++
      } else {
        bySource.llm++
      }

      // Count by category
      const category = entry.category || 'general'
      byCategory[category] = (byCategory[category] || 0) + 1

      // Track posts with terms
      if (entry.posts && Array.isArray(entry.posts)) {
        for (const post of entry.posts) {
          const postId = typeof post === 'object' ? post.id : post
          postsWithTerms.add(Number(postId))
        }
      }
    }

    // Calculate average terms per post
    const totalReferences = glossary.docs.reduce((sum, entry) => {
      return sum + (entry.posts?.length || 0)
    }, 0)

    const averageTermsPerPost = postsWithTerms.size > 0
      ? (totalReferences / postsWithTerms.size).toFixed(1)
      : '0'

    return NextResponse.json({
      terms: {
        total: glossary.docs.length,
        bySource,
        byCategory,
      },
      posts: {
        total: posts.docs.length,
        withTerms: postsWithTerms.size,
        withoutTerms: posts.docs.length - postsWithTerms.size,
        coverage: posts.docs.length > 0
          ? Math.round((postsWithTerms.size / posts.docs.length) * 100)
          : 0,
      },
      averageTermsPerPost,
      recentTerms: glossary.docs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(t => ({
          term: t.term,
          reading: t.reading,
          source: t.source,
          createdAt: t.createdAt,
        })),
    })
  } catch (error: any) {
    console.error('Error fetching glossary statistics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
