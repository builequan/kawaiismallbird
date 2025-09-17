import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

function removeDuplicateLinks(content: any): { modified: boolean; duplicatesRemoved: number } {
  if (!content?.root) return { modified: false, duplicatesRemoved: 0 }
  
  const seenTexts = new Set<string>()
  let duplicatesRemoved = 0
  
  function processNode(node: any): any {
    if (!node) return node
    
    // If it's a link node with affiliate URL
    if (node.type === 'link' && node.fields?.url && 
        (node.fields.url.includes('a8.net') || node.fields.url.includes('rakuten'))) {
      
      const linkText = node.children?.[0]?.text?.toLowerCase() || ''
      
      if (seenTexts.has(linkText)) {
        // Convert to plain text node
        duplicatesRemoved++
        return {
          type: 'text',
          text: node.children?.[0]?.text || '',
          version: 1
        }
      }
      
      seenTexts.add(linkText)
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children = node.children.map(child => processNode(child))
    }
    
    return node
  }
  
  const newRoot = JSON.parse(JSON.stringify(content.root))
  processNode(newRoot)
  
  return {
    modified: duplicatesRemoved > 0,
    duplicatesRemoved,
    content: { ...content, root: newRoot }
  }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔧 Fast Duplicate Link Removal')
  console.log('==================================================\n')
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0
  })
  
  const publishedPosts = posts.docs.filter((p: any) => p._status === 'published')
  console.log(`Found ${publishedPosts.length} published posts\n`)
  
  let totalFixed = 0
  let postsProcessed = 0
  
  // Process in batches
  const batchSize = 5
  for (let i = 0; i < publishedPosts.length; i += batchSize) {
    const batch = publishedPosts.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (post: any) => {
      if (!post.content?.root) return
      
      const result = removeDuplicateLinks(post.content)
      
      if (result.modified) {
        try {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: result.content
            }
          })
          
          console.log(`✅ ${post.title}: Removed ${result.duplicatesRemoved} duplicates`)
          totalFixed += result.duplicatesRemoved
          postsProcessed++
        } catch (error) {
          console.error(`❌ Failed to update ${post.title}: ${error}`)
        }
      }
    }))
    
    console.log(`Progress: ${Math.min(i + batchSize, publishedPosts.length)}/${publishedPosts.length}`)
  }
  
  console.log('\n==================================================')
  console.log(`✨ Deduplication Complete!`)
  console.log(`   Posts processed: ${postsProcessed}`)
  console.log(`   Total duplicate links removed: ${totalFixed}`)
  console.log(`   Average duplicates per post: ${postsProcessed > 0 ? (totalFixed / postsProcessed).toFixed(1) : '0'}`)
  console.log('==================================================\n')
  
  await payload.db.destroy()
}

main().catch(console.error)