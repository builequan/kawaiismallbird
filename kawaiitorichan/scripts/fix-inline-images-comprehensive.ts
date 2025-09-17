import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { uploadImageToPayload } from '../src/utilities/image-upload'

async function fixInlineImagesComprehensive() {
  console.log('Starting comprehensive inline image fix...')
  
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
    
    // Recursively process nodes to fix inline images
    const processNode = async (node: any): Promise<any> => {
      if (!node) return node
      
      // Handle paragraph nodes that might contain inline images
      if (node.type === 'paragraph' && node.children && Array.isArray(node.children)) {
        const newChildren = []
        
        for (const child of node.children) {
          // Check if this is a text node with markdown images
          if (child.type === 'text' && child.text) {
            const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
            let remainingText = child.text
            let lastIndex = 0
            let match
            
            // Process all images in this text node
            while ((match = imageRegex.exec(child.text)) !== null) {
              const altText = match[1] || ''
              const imagePath = match[2]
              
              console.log(`  Processing inline image: ${imagePath}`)
              
              // Add text before the image if any
              if (match.index > lastIndex) {
                const textBefore = child.text.substring(lastIndex, match.index)
                if (textBefore.trim()) {
                  newChildren.push({
                    ...child,
                    text: textBefore,
                  })
                }
              }
              
              // Upload the image and get the media ID
              const mediaId = await uploadImageToPayload({
                imagePath,
                imagesFolder,
                altText,
                payload,
              })
              
              if (mediaId) {
                modified = true
                
                // Add the upload node
                newChildren.push({
                  type: 'upload',
                  format: '',
                  indent: 0,
                  version: 1,
                  relationTo: 'media',
                  value: {
                    id: mediaId,
                  },
                })
                
                console.log(`    ✓ Converted to upload node with ID: ${mediaId}`)
              } else {
                // If upload failed, keep the original markdown
                newChildren.push({
                  ...child,
                  text: match[0],
                })
                console.log(`    ✗ Failed to upload, keeping markdown`)
              }
              
              lastIndex = match.index + match[0].length
            }
            
            // Add any remaining text after the last image
            if (lastIndex < child.text.length) {
              const textAfter = child.text.substring(lastIndex)
              if (textAfter.trim()) {
                newChildren.push({
                  ...child,
                  text: textAfter,
                })
              }
            }
            
            // If no images were found, keep the original child
            if (newChildren.length === 0) {
              newChildren.push(child)
            }
          } else {
            // Not a text node, process recursively
            const processedChild = await processNode(child)
            newChildren.push(processedChild)
          }
        }
        
        return {
          ...node,
          children: newChildren,
        }
      }
      
      // Process children recursively for other node types
      if (node.children && Array.isArray(node.children)) {
        const processedChildren = []
        
        for (const child of node.children) {
          const processed = await processNode(child)
          processedChildren.push(processed)
        }
        
        return {
          ...node,
          children: processedChildren,
        }
      }
      
      return node
    }
    
    // Process the content
    console.log(`\nProcessing post: ${post.title}`)
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
      console.log(`✓ Fixed inline images in post: ${post.title}`)
    } else {
      console.log(`- No inline images found in: ${post.title}`)
    }
  }
  
  console.log(`\nFixed ${fixedCount} posts with inline image issues`)
}

fixInlineImagesComprehensive()
  .then(() => {
    console.log('Comprehensive inline image fix complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })