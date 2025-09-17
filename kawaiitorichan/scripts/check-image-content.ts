import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkImageContent() {
  console.log('Checking image content in posts...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get a sample post with images
  const posts = await payload.find({
    collection: 'posts',
    limit: 5,
  })
  
  console.log(`Checking ${posts.docs.length} posts for image patterns...`)
  
  for (const post of posts.docs) {
    if (!post.content?.root) continue
    
    console.log(`\nPost: ${post.title}`)
    
    // Recursively check nodes for image patterns
    const checkNode = (node: any, path: string = ''): void => {
      if (!node) return
      
      // Check for text nodes with image markdown
      if (node.type === 'text' && node.text) {
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
        const matches = node.text.match(imageRegex)
        if (matches) {
          console.log(`  Found markdown image in text at ${path}: ${matches[0]}`)
        }
      }
      
      // Check for upload nodes
      if (node.type === 'upload') {
        console.log(`  Found upload node at ${path}:`, JSON.stringify(node.value, null, 2))
      }
      
      // Check for image-related content in any node
      if (node.value?.url && typeof node.value.url === 'string' && node.value.url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
        console.log(`  Found image URL at ${path}: ${node.value.url}`)
      }
      
      // Process children recursively
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any, index: number) => {
          checkNode(child, `${path}/children[${index}]`)
        })
      }
    }
    
    checkNode(post.content.root, 'root')
  }
}

checkImageContent()
  .then(() => {
    console.log('\nContent check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })