import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Load products data from JSON file
    const productsPath = path.join(DATA_DIR, 'products-index.json')
    let totalProducts = 0
    let activeProducts = 0
    
    try {
      const productsData = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
      totalProducts = productsData.length
      activeProducts = productsData.length // All products are considered active
    } catch (e) {
      console.log('Products file not found')
    }
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: 1000
    })
    
    // Count posts with affiliate links
    let postsWithLinks = 0
    let totalLinks = 0
    
    for (const post of posts.docs) {
      if (!post.content?.root?.children) continue
      
      let postLinks = 0
      
      // Recursively count affiliate links in content
      function countLinks(node: any) {
        if (node.type === 'link' && node.fields?.rel?.includes('sponsored')) {
          postLinks++
        }
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(countLinks)
        }
      }
      
      post.content.root.children.forEach(countLinks)
      
      if (postLinks > 0) {
        postsWithLinks++
        totalLinks += postLinks
      }
    }
    
    const averageLinksPerPost = postsWithLinks > 0 
      ? Number((totalLinks / postsWithLinks).toFixed(1))
      : 0
    
    const coverage = posts.docs.length > 0
      ? ((postsWithLinks / posts.docs.length) * 100).toFixed(0) + '%'
      : '0%'
    
    // Language distribution (simplified - assuming Japanese posts)
    const languageDistribution = {
      ja: postsWithLinks,
      en: 0
    }
    
    const statistics = {
      totalProducts,
      activeProducts,
      postsWithLinks,
      totalPosts: posts.docs.length,
      totalLinks,
      averageLinksPerPost,
      coverage,
      languageDistribution
    }
    
    return NextResponse.json({
      success: true,
      statistics
    })
    
  } catch (error: any) {
    console.error('Statistics error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load statistics',
        details: error.message
      },
      { status: 500 }
    )
  }
}