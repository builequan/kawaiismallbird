import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { uploadImageToPayload } from '../src/utilities/image-upload'

async function fixImageNodes() {
  console.log('Starting image node fix...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Get all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  console.log(`Found ${posts.docs.length} posts to check`)
  
  let fixedCount = 0
  const imagesFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/images'
  
  for (const post of posts.docs) {
    if (!post.content?.root) continue
    
    let modified = false
    
    // Recursively process nodes to fix image references
    const processNode = async (node: any): Promise<any> => {
      if (!node) return node
      
      // Check if this is an upload node with a URL instead of an ID
      if (node.type === 'upload' && node.value?.url && !node.value?.id) {
        const imagePath = node.value.url
        const altText = node.value.alt || node.value.filename || ''
        
        console.log(`  Processing image: ${imagePath}`)
        
        // Upload the image and get the media ID
        const mediaId = await uploadImageToPayload({
          imagePath,
          imagesFolder,
          altText,
          payload,
        })
        
        if (mediaId) {
          modified = true
          // Return proper upload node structure
          return {
            ...node,
            value: {
              id: mediaId,
            },
            relationTo: 'media',
          }
        }
      }
      
      // Process children recursively
      if (node.children && Array.isArray(node.children)) {
        const processedChildren = await Promise.all(
          node.children.map((child: any) => processNode(child))
        )
        return {
          ...node,
          children: processedChildren,
        }
      }
      
      return node
    }
    
    // Process the content
    const processedRoot = await processNode(post.content.root)
    
    if (modified) {
      // Update the post with fixed content
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: {
            root: processedRoot,
          },
        },
      })
      
      fixedCount++
      console.log(`✓ Fixed images in post: ${post.title}`)
    }
  }
  
  console.log(`\nFixed ${fixedCount} posts with image issues`)
}

fixImageNodes()
  .then(() => {
    console.log('Image fix complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })