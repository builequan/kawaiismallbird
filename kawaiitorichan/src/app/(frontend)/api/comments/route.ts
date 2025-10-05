import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()

    const { postId, authorName, content } = body

    // Validation
    if (!postId || !authorName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (authorName.length > 100) {
      return NextResponse.json(
        { error: 'Name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Get IP address for spam prevention
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown'

    // Create comment
    const comment = await payload.create({
      collection: 'comments',
      data: {
        post: postId,
        authorName: authorName.trim(),
        content: content.trim(),
        approved: false, // Requires admin approval
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'コメントありがとうございます！承認後に表示されます。',
      comment,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to submit comment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Fetch approved comments for the post
    const { docs: comments } = await payload.find({
      collection: 'comments',
      where: {
        and: [
          { post: { equals: postId } },
          { approved: { equals: true } },
        ],
      },
      sort: '-createdAt',
      limit: 100,
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
