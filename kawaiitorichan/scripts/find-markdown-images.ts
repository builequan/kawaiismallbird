import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function findMarkdownImages() {
  console.log('Searching for markdown images in text nodes...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  console.log(`Checking ${posts.docs.length} posts for markdown images...`)
  
  let foundCount = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root) continue
    
    let hasMarkdownImages = false
    
    // Recursively check nodes for markdown images in text
    const checkNode = (node: any): void => {
      if (!node) return
      
      // Check for text nodes with markdown image syntax
      if (node.type === 'text' && node.text) {
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
        const matches = node.text.match(imageRegex)
        if (matches) {
          hasMarkdownImages = true
          console.log(`  Found markdown images in "${post.title}":`)
          matches.forEach(match => {
            console.log(`    - ${match}`)
          })
        }
      }
      
      // Process children recursively
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          checkNode(child)
        })
      }
    }
    
    checkNode(post.content.root)
    
    if (hasMarkdownImages) {
      foundCount++
    }
  }
  
  console.log(`\nFound ${foundCount} posts with markdown images in text nodes`)
}

findMarkdownImages()
  .then(() => {
    console.log('Search complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })