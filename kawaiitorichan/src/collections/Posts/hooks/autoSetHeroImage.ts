import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Automatically set hero image from content if not provided
 * This ensures all posts always have a hero image for thumbnails
 */
export const autoSetHeroImage: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // Only run on create or update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  // If heroImage is already set, no need to do anything
  if (data.heroImage) {
    return data
  }

  // Try to extract first image from content
  const extractImageFromContent = (content: any): number | null => {
    if (!content) return null

    // Recursively search for upload nodes
    const findUpload = (obj: any): any => {
      if (!obj) return null

      if (typeof obj === 'object') {
        // Check if this is an upload node
        if (obj.type === 'upload' && obj.relationTo === 'media' && obj.value) {
          return typeof obj.value === 'number' ? obj.value : obj.value.id
        }

        // Search in arrays
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const result = findUpload(item)
            if (result) return result
          }
        } else {
          // Search in object properties
          for (const key in obj) {
            const result = findUpload(obj[key])
            if (result) return result
          }
        }
      }

      return null
    }

    return findUpload(content)
  }

  // Extract image from content
  const imageId = extractImageFromContent(data.content)

  if (imageId) {
    console.log(`[autoSetHeroImage] Setting hero image ${imageId} for post`)
    data.heroImage = imageId
  } else {
    // Use default image if no image found
    console.log('[autoSetHeroImage] No image in content, using default image 904')
    data.heroImage = 904
  }

  return data
}