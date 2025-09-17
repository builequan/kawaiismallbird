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
    //     { error: 'Unauthorized. Please log in to view statistics.' },
    //     { status: 401 }
    //   )
    // }
    
    // Fetch all published posts
    const { docs: posts } = await payload.find({
      collection: 'posts',
      limit: 1000,
      where: {
        _status: { equals: 'published' }
      },
      depth: 0
    })
    
    // Process statistics
    let totalLinks = 0
    let postsWithLinks = 0
    let postsWithoutLinks = 0
    const anchorTexts = new Map<string, number>()
    const targetPosts = new Map<string, { count: number; title: string }>()
    const linkDistribution = { 0: 0, '1-2': 0, '3-4': 0, '5+': 0 }
    
    for (const post of posts) {
      let postLinkCount = 0
      
      // Count and analyze links
      if (post.content?.root?.children) {
        for (const node of post.content.root.children) {
          if (node.children) {
            for (const child of node.children) {
              if (child.type === 'link' && child.fields?.linkType === 'internal') {
                postLinkCount++
                totalLinks++
                
                // Track anchor text
                const linkText = child.children?.[0]?.text || ''
                if (linkText) {
                  anchorTexts.set(linkText, (anchorTexts.get(linkText) || 0) + 1)
                }
                
                // Track target posts
                const targetId = child.fields?.doc?.value || child.fields?.doc
                if (targetId) {
                  const current = targetPosts.get(targetId) || { count: 0, title: '' }
                  current.count++
                  targetPosts.set(targetId, current)
                }
              }
            }
          }
        }
      }
      
      // Update counters
      if (postLinkCount > 0) {
        postsWithLinks++
      } else {
        postsWithoutLinks++
      }
      
      // Update distribution
      if (postLinkCount === 0) {
        linkDistribution['0']++
      } else if (postLinkCount <= 2) {
        linkDistribution['1-2']++
      } else if (postLinkCount <= 4) {
        linkDistribution['3-4']++
      } else {
        linkDistribution['5+']++
      }
    }
    
    // Get post titles for most linked targets
    const targetIds = Array.from(targetPosts.keys())
    if (targetIds.length > 0) {
      const { docs: targetPostDocs } = await payload.find({
        collection: 'posts',
        where: {
          id: { in: targetIds }
        },
        limit: 100
      })
      
      // Update titles
      for (const doc of targetPostDocs) {
        const target = targetPosts.get(doc.id)
        if (target) {
          target.title = doc.title
        }
      }
    }
    
    // Sort and get top anchor texts
    const topAnchorTexts = Array.from(anchorTexts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }))
    
    // Sort and get most linked posts
    const mostLinkedPosts = Array.from(targetPosts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        title: data.title,
        linkCount: data.count
      }))
    
    const avgLinksPerPost = posts.length > 0 ? totalLinks / posts.length : 0
    
    return NextResponse.json({
      success: true,
      overview: {
        totalPosts: posts.length,
        postsWithLinks,
        postsWithoutLinks,
        totalLinks,
        averageLinksPerPost: avgLinksPerPost.toFixed(2),
        linkCoverage: posts.length > 0 ? ((postsWithLinks / posts.length) * 100).toFixed(1) + '%' : '0%'
      },
      distribution: linkDistribution,
      topAnchorTexts,
      mostLinkedPosts,
      recentActivity: {
        lastProcessed: posts
          .filter(p => p.internalLinksMetadata?.lastProcessed)
          .sort((a, b) => {
            const dateA = new Date(a.internalLinksMetadata?.lastProcessed || 0)
            const dateB = new Date(b.internalLinksMetadata?.lastProcessed || 0)
            return dateB.getTime() - dateA.getTime()
          })
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            processedAt: p.internalLinksMetadata?.lastProcessed
          }))
      }
    })
    
  } catch (error: any) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch statistics',
        details: error.message 
      },
      { status: 500 }
    )
  }
}