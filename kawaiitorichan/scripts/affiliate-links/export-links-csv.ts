import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'
import * as fs from 'fs/promises'
import * as path from 'path'

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

/**
 * Export affiliate links to CSV
 */
async function exportToCSV() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('📊 Exporting Affiliate Links to CSV')
  console.log('==================================================\n')
  
  try {
    // Get all published posts with affiliate links
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 0
    })
    
    const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
    console.log(`Found ${publishedPosts.length} published posts\n`)
    
    // Build CSV data
    const csvLines: string[] = []
    
    // Add header
    csvLines.push('Article Title,Article Link,Product Name,Affiliate URL')
    
    let totalLinks = 0
    let postsWithLinks = 0
    
    for (const post of publishedPosts) {
      if (!post.content?.root) continue
      
      // Extract affiliate links from content
      const links = extractAffiliateLinks(post.content)
      
      if (links.length > 0) {
        postsWithLinks++
        
        // Add a line for each link in the post
        for (const link of links) {
          const articleTitle = `"${(post.title || '').replace(/"/g, '""')}"`
          const articleLink = `https://artifydemos.com/posts/${post.slug}`
          const productName = `"${link.productName.replace(/"/g, '""')}"`
          const affiliateUrl = `"${link.url}"`
          
          csvLines.push(`${articleTitle},${articleLink},${productName},${affiliateUrl}`)
          totalLinks++
        }
      }
    }
    
    // Save to file
    const timestamp = new Date().toISOString().split('T')[0]
    const outputPath = path.join(process.cwd(), `affiliate-links-export-${timestamp}.csv`)
    
    await fs.writeFile(outputPath, csvLines.join('\n'), 'utf-8')
    
    console.log('==================================================')
    console.log('✅ Export Complete!')
    console.log(`   File: ${outputPath}`)
    console.log(`   Posts with links: ${postsWithLinks}`)
    console.log(`   Total links exported: ${totalLinks}`)
    console.log('==================================================\n')
    
    return outputPath
  } catch (error) {
    console.error('❌ Error exporting CSV:', error)
    throw error
  } finally {
    await payload.db.destroy()
  }
}

// Run if called directly
if (require.main === module) {
  exportToCSV().catch(console.error)
}

export { exportToCSV }