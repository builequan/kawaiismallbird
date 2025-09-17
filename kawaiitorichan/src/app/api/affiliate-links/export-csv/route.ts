import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Extract affiliate links from content
 */
function extractAffiliateLinks(content: any): Array<{ productName: string; url: string }> {
  const links: Array<{ productName: string; url: string }> = []
  
  function traverse(node: any) {
    if (!node) return
    
    // Check if this is an affiliate link
    if (node.type === 'link' && node.fields?.url) {
      const url = node.fields.url
      if (url.includes('a8.net') || url.includes('rakuten')) {
        const text = node.children?.[0]?.text || 'Unknown Product'
        links.push({
          productName: text,
          url: url
        })
      }
    }
    
    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }
  
  if (content?.root) {
    traverse(content.root)
  }
  
  return links
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 0
    })
    
    const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
    
    // Build CSV data
    const csvLines: string[] = []
    
    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF'
    
    // Add header
    csvLines.push('Article Title,Article Link,Product Name,Affiliate URL')
    
    for (const post of publishedPosts) {
      if (!post.content?.root) continue
      
      // Extract affiliate links from content
      const links = extractAffiliateLinks(post.content)
      
      if (links.length > 0) {
        // Add a line for each link in the post
        for (const link of links) {
          const articleTitle = `"${(post.title || '').replace(/"/g, '""')}"`
          const articleLink = `https://artifydemos.com/posts/${post.slug}`
          const productName = `"${link.productName.replace(/"/g, '""')}"`
          const affiliateUrl = `"${link.url}"`
          
          csvLines.push(`${articleTitle},${articleLink},${productName},${affiliateUrl}`)
        }
      }
    }
    
    // Create CSV content
    const csvContent = BOM + csvLines.join('\n')
    
    // Create response with proper headers
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="affiliate-links-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
    
    return response
    
  } catch (error: any) {
    console.error('Export CSV error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to export CSV',
        details: error.message,
      },
      { status: 500 }
    )
  }
}