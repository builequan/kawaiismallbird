import fs from 'fs'
import path from 'path'
import { Payload } from 'payload'

interface UploadImageOptions {
  imagePath: string
  imagesFolder: string
  altText?: string
  payload: Payload
}

interface MediaDocument {
  id: string
  filename: string
  mimeType: string
  filesize: number
  width?: number
  height?: number
  url: string
  alt?: string
}

/**
 * Upload an image file to Payload's Media collection
 */
export async function uploadImageToPayload({
  imagePath,
  imagesFolder,
  altText,
  payload,
}: UploadImageOptions): Promise<string | null> {
  try {
    // Extract filename from path
    const imageFileName = path.basename(imagePath)
    const fullImagePath = path.join(imagesFolder, imageFileName)
    
    // Check if file exists
    if (!fs.existsSync(fullImagePath)) {
      console.warn(`Image not found: ${fullImagePath}`)
      return null
    }
    
    // Check if image already exists in media library
    const existingMedia = await payload.find({
      collection: 'media',
      where: {
        filename: {
          equals: imageFileName,
        },
      },
      limit: 1,
    })
    
    if (existingMedia.docs.length > 0) {
      console.log(`Image already exists: ${imageFileName}`)
      return existingMedia.docs[0].id
    }
    
    // Upload using our direct upload function
    const uploadResult = await uploadFileDirectly({
      payload,
      collectionSlug: 'media',
      filePath: fullImagePath,
      data: {
        alt: altText || imageFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      },
    })
    
    if (uploadResult) {
      console.log(`Successfully uploaded: ${imageFileName}`)
      return uploadResult.id
    }
    
    return null
  } catch (error) {
    console.error(`Error uploading image ${imagePath}:`, error)
    return null
  }
}

/**
 * Direct file upload using Payload's internal methods
 */
async function uploadFileDirectly({
  payload,
  collectionSlug,
  filePath,
  data,
}: {
  payload: Payload
  collectionSlug: string
  filePath: string
  data: any
}): Promise<any> {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const mimeType = getMimeType(fileName)
    const stats = fs.statSync(filePath)
    
    // Create a file-like object
    const file = {
      data: fileBuffer,
      mimetype: mimeType,
      name: fileName,
      size: stats.size,
    }
    
    // Use Payload's create method with the file
    const doc = await payload.create({
      collection: collectionSlug,
      data,
      file,
    })
    
    return doc
  } catch (error) {
    console.error('Direct upload error:', error)
    
    // Fallback: Copy file directly to media folder
    const mediaDir = path.join(process.cwd(), 'public', 'media')
    const targetPath = path.join(mediaDir, fileName)
    
    // Ensure media directory exists
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true })
    }
    
    // Copy file
    fs.copyFileSync(filePath, targetPath)
    
    // Create media document without file upload
    const doc = await payload.create({
      collection: collectionSlug,
      data: {
        ...data,
        filename: fileName,
        mimeType,
        filesize: stats.size,
        url: `/media/${fileName}`,
      },
    })
    
    return doc
  }
}

/**
 * Process images in Lexical content and replace with Media references
 */
export async function processContentImages(
  content: any,
  images: string[],
  imagesFolder: string,
  payload: Payload
): Promise<any> {
  if (!content || !content.root || !images || images.length === 0) {
    return content
  }
  
  // Create a map of image URLs to media IDs
  const imageMap: Record<string, string> = {}
  
  for (const imagePath of images) {
    const mediaId = await uploadImageToPayload({
      imagePath,
      imagesFolder,
      payload,
    })
    
    if (mediaId) {
      imageMap[imagePath] = mediaId
    }
  }
  
  // Recursively process content nodes to replace image references
  const processNode = (node: any): any => {
    if (!node) return node
    
    // If this is an image node, update it
    if (node.type === 'upload' && node.value?.url) {
      const imagePath = node.value.url
      if (imageMap[imagePath]) {
        return {
          ...node,
          value: {
            id: imageMap[imagePath],
          },
          relationTo: 'media',
        }
      }
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map(processNode),
      }
    }
    
    return node
  }
  
  return {
    ...content,
    root: processNode(content.root),
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}