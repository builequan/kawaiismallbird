import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const { 
      deleteAll = false,
      source = null,
      beforeDate = null,
      productIds = null,
    } = body
    
    let whereClause: any = {}
    let deletionType = 'selective'
    
    if (deleteAll) {
      // Delete all products
      deletionType = 'all'
      // Empty where clause will match all documents
    } else if (productIds && Array.isArray(productIds)) {
      // Delete specific products by IDs
      whereClause = {
        id: {
          in: productIds,
        },
      }
      deletionType = 'specific'
    } else if (source) {
      // Delete products from a specific source
      whereClause = {
        'metadata.source': {
          equals: source,
        },
      }
      deletionType = 'by_source'
    } else if (beforeDate) {
      // Delete products imported before a certain date
      whereClause = {
        'metadata.importedAt': {
          less_than: beforeDate,
        },
      }
      deletionType = 'by_date'
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No deletion criteria provided',
          details: 'Specify deleteAll, source, beforeDate, or productIds',
        },
        { status: 400 }
      )
    }
    
    // First, get count of products to be deleted
    const productsToDelete = await payload.find({
      collection: 'affiliate-products',
      where: whereClause,
      limit: 10000,
    })
    
    const totalToDelete = productsToDelete.totalDocs
    
    if (totalToDelete === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No products matched the deletion criteria',
        deletionType,
      })
    }
    
    // Before deleting products, clear affiliate links from posts
    if (deleteAll) {
      console.log('Clearing all affiliate links from posts...')
      // First get all posts (we'll filter in memory)
      const allPosts = await payload.find({
        collection: 'posts',
        limit: 10000,
      })
      
      const postsWithLinks = allPosts.docs.filter(post => 
        post.affiliateLinksMetadata?.linksAdded && 
        post.affiliateLinksMetadata.linksAdded.length > 0
      )
      
      for (const post of postsWithLinks) {
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
      }
      console.log(`Cleared affiliate links from ${postsWithLinks.length} posts`)
    }
    
    // Delete the products
    let deletedCount = 0
    let errors = 0
    
    // Delete in batches to avoid timeout
    const batchSize = 100
    for (let i = 0; i < productsToDelete.docs.length; i += batchSize) {
      const batch = productsToDelete.docs.slice(i, i + batchSize)
      
      for (const product of batch) {
        try {
          await payload.delete({
            collection: 'affiliate-products',
            id: product.id,
          })
          deletedCount++
        } catch (error) {
          console.error(`Error deleting product ${product.id}:`, error)
          errors++
        }
      }
      
      // Log progress for large deletions
      if (totalToDelete > 100) {
        console.log(`Deleted ${deletedCount}/${totalToDelete} products...`)
      }
    }
    
    const message = deleteAll
      ? `Deleted all ${deletedCount} affiliate products and cleared links from posts`
      : `Deleted ${deletedCount} products (${deletionType})`
    
    return NextResponse.json({
      success: true,
      deletedCount,
      errors,
      totalBefore: totalToDelete,
      message,
      deletionType,
    })
  } catch (error: any) {
    console.error('Delete products error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete products',
        details: error.message,
      },
      { status: 500 }
    )
  }
}