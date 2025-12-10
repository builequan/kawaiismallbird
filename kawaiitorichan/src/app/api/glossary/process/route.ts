import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { processPost, processPosts, processAllPosts } from '@/services/glossary-processor'

export const maxDuration = 300 // 5 minutes max for processing

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to manage glossary.' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { postId, postIds, all = false, batchSize = 10 } = body

    // Single post processing
    if (postId) {
      const result = await processPost(postId)
      return NextResponse.json({
        success: true,
        message: `Processed post: ${result.postTitle}`,
        result,
      })
    }

    // Multiple posts processing
    if (postIds && Array.isArray(postIds) && postIds.length > 0) {
      const results = await processPosts(postIds)

      const totalNewTerms = results.reduce((sum, r) => sum + r.newTerms, 0)
      const totalLinkedTerms = results.reduce((sum, r) => sum + r.linkedTerms, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} posts`,
        stats: {
          processed: results.length,
          newTerms: totalNewTerms,
          linkedTerms: totalLinkedTerms,
          errors: totalErrors,
        },
        results,
      })
    }

    // Process all posts
    if (all) {
      const { results, totalNewTerms, totalLinkedTerms, totalErrors } = await processAllPosts(
        undefined,
        batchSize
      )

      return NextResponse.json({
        success: true,
        message: `Processed all ${results.length} posts`,
        stats: {
          processed: results.length,
          newTerms: totalNewTerms,
          linkedTerms: totalLinkedTerms,
          errors: totalErrors,
        },
      })
    }

    return NextResponse.json(
      { error: 'Please provide postId, postIds array, or set all to true' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error processing glossary:', error)
    return NextResponse.json(
      {
        error: 'Failed to process glossary',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
