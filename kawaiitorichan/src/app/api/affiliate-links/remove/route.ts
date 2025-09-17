import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Get all posts with affiliate links
    const posts = await payload.find({
      collection: 'posts',
      where: {
        'affiliateLinksMetadata.linksAdded': {
          exists: true,
        },
      },
      limit: 10000,
    })
    
    let processed = 0
    let errors = 0
    
    for (const post of posts.docs) {
      try {
        // Clear affiliate links metadata
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            affiliateLinksMetadata: {
              version: null,
              lastProcessed: null,
              linksAdded: [],
              contentHash: null,
              excludeFromAffiliates: post.affiliateLinksMetadata?.excludeFromAffiliates || false,
            },
          },
        })
        
        processed++
      } catch (error) {
        console.error(`Error removing links from post ${post.id}:`, error)
        errors++
      }
    }
    
    // Reset product usage counts
    const products = await payload.find({
      collection: 'affiliate-products',
      where: {
        'performance.usageCount': {
          greater_than: 0,
        },
      },
      limit: 10000,
    })
    
    for (const product of products.docs) {
      await payload.update({
        collection: 'affiliate-products',
        id: product.id,
        data: {
          performance: {
            ...product.performance,
            usageCount: 0,
          },
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      processed,
      errors,
      message: `Removed affiliate links from ${processed} posts`,
    })
  } catch (error: any) {
    console.error('Remove error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Remove failed',
        details: error.message,
      },
      { status: 500 }
    )
  }
}