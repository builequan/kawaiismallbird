import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

function limitAffiliateLinks(content: any, maxLinks: number = 5): { modified: boolean; linksRemoved: number; content: any } {
  if (!content?.root) return { modified: false, linksRemoved: 0, content }
  
  let linkCount = 0
  let linksRemoved = 0
  
  function processNode(node: any): any {
    if (!node) return node
    
    // If it's an affiliate link node
    if (node.type === 'link' && node.fields?.url && 
        (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
      
      if (linkCount >= maxLinks) {
        // Convert to plain text node
        linksRemoved++
        return {
          type: 'text',
          text: node.children?.[0]?.text || '',
          version: 1
        }
      }
      
      linkCount++
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(child => processNode(child))
    }
    
    return node
  }
  
  const newContent = JSON.parse(JSON.stringify(content))
  processNode(newContent.root)
  
  return {
    modified: linksRemoved > 0,
    linksRemoved,
    content: newContent
  }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('📉 Limiting Affiliate Links to 5 Per Post')
  console.log('==================================================\n')
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0
  })
  
  const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
  console.log(`Found ${publishedPosts.length} published posts\n`)
  
  let totalLinksRemoved = 0
  let postsModified = 0
  const batchSize = 5
  
  for (let i = 0; i < publishedPosts.length; i += batchSize) {
    const batch = publishedPosts.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (post: any) => {
      if (!post.content?.root) return
      
      // First count existing links
      let existingLinks = 0
      function countLinks(node: any) {
        if (!node) return
        if (node.type === 'link' && node.fields?.url && 
            (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
          existingLinks++
        }
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach(countLinks)
        }
      }
      countLinks(post.content.root)
      
      if (existingLinks <= 5) {
        console.log(`✅ ${post.title}: Already has ${existingLinks} links`)
        return
      }
      
      const result = limitAffiliateLinks(post.content, 5)
      
      if (result.modified) {
        try {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: result.content
            }
          })
          
          console.log(`📝 ${post.title}: Reduced from ${existingLinks} to 5 links (removed ${result.linksRemoved})`)
          totalLinksRemoved += result.linksRemoved
          postsModified++
        } catch (error) {
          console.error(`❌ Failed to update ${post.title}: ${error}`)
        }
      }
    }))
    
    console.log(`Progress: ${Math.min(i + batchSize, publishedPosts.length)}/${publishedPosts.length}`)
  }
  
  console.log('\n==================================================')
  console.log(`✨ Link Limiting Complete!`)
  console.log(`   Posts modified: ${postsModified}`)
  console.log(`   Total links removed: ${totalLinksRemoved}`)
  console.log(`   All posts now have maximum 5 affiliate links`)
  console.log('==================================================\n')
  
  await payload.db.destroy()
}

main().catch(console.error)