import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // Check database connection and counts
    const postCount = await payload.count({ collection: 'posts' })
    const categoryCount = await payload.count({ collection: 'categories' })
    const mediaCount = await payload.count({ collection: 'media' })

    // Get a sample post
    const samplePosts = await payload.find({
      collection: 'posts',
      limit: 3,
      depth: 0,
    })

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        posts: postCount.totalDocs,
        categories: categoryCount.totalDocs,
        media: mediaCount.totalDocs,
      },
      samplePosts: samplePosts.docs.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p._status,
      })),
      environment: {
        DATABASE_URI_exists: !!process.env.DATABASE_URI,
        PAYLOAD_SECRET_exists: !!process.env.PAYLOAD_SECRET,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}