import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { uploadImageToPayload } from '../src/utilities/image-upload'

async function fixMarkdownImagesInText() {
  console.log('Starting markdown image fix in text nodes...')
  
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
    
    // Recursively process nodes to fix markdown images in text
    const processNode = async (node: any): Promise<any> => {
      if (!node) return node
      
      // Check for paragraph nodes that might contain images
      if (node.type === 'paragraph' && node.children && Array.isArray(node.children)) {
        const newChildren = []
        
        for (const child of node.children) {
          // Check if this is a text node with markdown image
          if (child.type === 'text' && child.text) {
            const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
            const match = imageRegex.exec(child.text)
            
            if (match) {
              const altText = match[1] || ''
              const imagePath = match[2]
              
              console.log(`  Found markdown image: ${imagePath}`)
              
              // Upload the image and get the media ID
              const mediaId = await uploadImageToPayload({
                imagePath,
                imagesFolder,
                altText,
                payload,
              })
              
              if (mediaId) {
                modified = true
                
                // Split the text around the image
                const beforeImage = child.text.substring(0, match.index)
                const afterImage = child.text.substring(match.index + match[0].length)
                
                // Add text before image if exists
                if (beforeImage) {
                  newChildren.push({
                    ...child,
                    text: beforeImage,
                  })
                }
                
                // Return to parent paragraph level - we need to replace the whole paragraph
                // with an upload node followed by a new paragraph for any remaining text
                return {
                  type: 'upload',
                  format: '',
                  indent: 0,
                  version: 1,
                  relationTo: 'media',
                  value: {
                    id: mediaId,
                  },
                }
              } else {
                // If upload failed, keep the original text
                newChildren.push(child)
              }
            } else {
              // No image in this text node
              newChildren.push(child)
            }
          } else {
            // Not a text node
            newChildren.push(child)
          }
        }
        
        // If we found an upload node, return it directly (replacing the paragraph)
        const uploadNode = newChildren.find(n => n.type === 'upload')
        if (uploadNode) {
          return uploadNode
        }
        
        // Otherwise return the paragraph with processed children
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
  
  console.log(`\nFixed ${fixedCount} posts with markdown images in text`)
}

fixMarkdownImagesInText()
  .then(() => {
    console.log('Markdown image fix complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })