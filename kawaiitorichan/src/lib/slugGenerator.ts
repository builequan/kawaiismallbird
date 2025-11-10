import type { Payload } from 'payload'

/**
 * Generate a unique slug by checking for duplicates and adding number suffix
 * @param payload - Payload instance
 * @param baseSlug - Base slug to check
 * @param collection - Collection name (default: 'posts')
 * @returns Unique slug (may have -1, -2, etc. suffix if duplicate found)
 */
export async function generateUniqueSlug(
  payload: Payload,
  baseSlug: string,
  collection: string = 'posts',
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  // Check if slug exists
  while (true) {
    const existing = await payload.find({
      collection,
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })

    // If no existing post with this slug, we can use it
    if (existing.docs.length === 0) {
      return slug
    }

    // Otherwise, try with a number suffix
    slug = `${baseSlug}-${counter}`
    counter++

    // Safety limit to prevent infinite loop
    if (counter > 1000) {
      throw new Error(`Could not generate unique slug for: ${baseSlug}`)
    }
  }
}

/**
 * Format a string into a URL-friendly slug
 * Supports Japanese characters, English, and numbers
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]+/g, '') // Keep only alphanumeric, Japanese, underscore, hyphen
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
}

/**
 * Generate slug from filename
 * Removes file extension and formats the name
 */
export function slugFromFilename(filename: string): string {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '')
  return formatSlug(nameWithoutExt)
}
