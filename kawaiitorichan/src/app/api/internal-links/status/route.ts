import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    // Check authentication (disabled for development - enable in production!)
    const payload = await getPayload({ config: configPromise })
    // const { user } = await payload.auth({ headers: request.headers })
    
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized. Please log in to view link status.' },
    //     { status: 401 }
    //   )
    // }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') // 'all', 'linked', 'unlinked'
    const category = searchParams.get('category')
    
    // Build where clause
    const where: any = {
      _status: { equals: 'published' }
    }
    
    if (category) {
      where.categories = { contains: category }
    }
    
    // Fetch posts
    const { docs: posts, totalDocs, totalPages } = await payload.find({
      collection: 'posts',
      page,
      limit,
      where,
      sort: '-createdAt',
      depth: 0
    })
    
    // Process posts to get link status
    const postsWithStatus = posts.map(post => {
      let linkCount = 0
      const links = []
      
      // Count internal links in content
      if (post.content?.root?.children) {
        for (const node of post.content.root.children) {
          if (node.children) {
            for (const child of node.children) {
              if (child.type === 'link' && child.fields?.linkType === 'internal') {
                linkCount++
                // Get link text and target
                const linkText = child.children?.[0]?.text || ''
                const targetId = child.fields?.doc?.value || child.fields?.doc
                links.push({
                  text: linkText,
                  targetId
                })
              }
            }
          }
        }
      }
      
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        linkCount,
        links: links.slice(0, 5), // Return max 5 link details
        lastProcessed: post.internalLinksMetadata?.lastProcessed || null,
        status: linkCount > 0 ? 'linked' : 'unlinked',
        publishedAt: post.publishedAt,
        categories: post.categories
      }
    })
    
    // Apply filter if specified
    let filteredPosts = postsWithStatus
    if (filter === 'linked') {
      filteredPosts = postsWithStatus.filter(p => p.linkCount > 0)
    } else if (filter === 'unlinked') {
      filteredPosts = postsWithStatus.filter(p => p.linkCount === 0)
    }
    
    // Calculate statistics
    const totalLinked = postsWithStatus.filter(p => p.linkCount > 0).length
    const totalUnlinked = postsWithStatus.filter(p => p.linkCount === 0).length
    const avgLinksPerPost = postsWithStatus.reduce((sum, p) => sum + p.linkCount, 0) / postsWithStatus.length
    
    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      statistics: {
        total: totalDocs,
        linked: totalLinked,
        unlinked: totalUnlinked,
        averageLinksPerPost: avgLinksPerPost.toFixed(2)
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching link status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch link status',
        details: error.message 
      },
      { status: 500 }
    )
  }
}