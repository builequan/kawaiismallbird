import type { CollectionAfterReadHook } from 'payload'
import { User } from 'src/payload-types'

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  // Early return if doc is not valid or if we're in admin context and loading drafts
  if (!doc) {
    return doc
  }

  // Skip population if authors field doesn't exist or is empty
  if (!doc?.authors || !Array.isArray(doc.authors) || doc.authors.length === 0) {
    return doc
  }

  try {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      // Skip null/undefined authors
      if (!author) continue

      try {
        const authorId = typeof author === 'object' && author !== null ? author?.id : author

        // Skip if no valid ID
        if (!authorId) continue

        const authorDoc = await payload.findByID({
          id: authorId,
          collection: 'users',
          depth: 0,
          // Add overrideAccess to ensure we can read users in admin context
          overrideAccess: false,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }
      } catch (error) {
        // Log error for debugging but don't break the entire post loading
        console.warn(`Failed to populate author ${typeof author === 'object' ? author?.id : author}:`, error)
      }
    }

    // Only add populatedAuthors if we found any authors
    if (authorDocs.length > 0) {
      doc.populatedAuthors = authorDocs.map((authorDoc) => ({
        id: authorDoc.id,
        name: authorDoc.name || 'Unknown Author',
      }))
    }
  } catch (error) {
    // Log error but don't break the post loading
    console.error('Error in populateAuthors hook:', error)
  }

  return doc
}
