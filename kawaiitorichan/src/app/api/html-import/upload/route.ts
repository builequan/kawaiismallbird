import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  parseHTML,
  extractImagesFromHTML,
  uploadImageToPayload,
} from '@/lib/htmlParser'
import { convertHTMLToPayloadLexical } from '@/lib/htmlToLexical'
import { matchCategories } from '@/lib/categoryMatcher'
import { generateUniqueSlug } from '@/lib/slugGenerator'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Parse multipart form data
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 },
      )
    }

    const results = {
      success: [] as any[],
      failed: [] as any[],
      warnings: [] as any[],
    }

    // Get all categories for matching
    const categoriesData = await payload.find({
      collection: 'categories',
      limit: 100,
    })

    // Process each HTML file
    for (const file of files) {
      try {
        // Only process HTML files
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
          results.failed.push({
            filename: file.name,
            error: 'Only HTML files are supported',
          })
          continue
        }

        // Read file content
        const htmlContent = await file.text()

        // Parse HTML
        const parsed = parseHTML(htmlContent)

        if (!parsed.title || !parsed.content) {
          results.failed.push({
            filename: file.name,
            error: 'Could not extract title or content from HTML',
          })
          continue
        }

        // Generate slug from filename
        const baseSlug = file.name
          .replace(/\.html?$/i, '')
          .toLowerCase()
          .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g, '_')
          .replace(/^_+|_+$/g, '')

        const slug = await generateUniqueSlug(payload, baseSlug)

        // Check if slug was modified (duplicate found)
        if (slug !== baseSlug) {
          results.warnings.push({
            filename: file.name,
            message: `Slug "${baseSlug}" already exists, using "${slug}" instead`,
          })
        }

        // Match categories based on title
        const matchedCategories = matchCategories(parsed.title, categoriesData.docs)

        // Extract and upload images
        const images = extractImagesFromHTML(htmlContent)
        let heroImageId = null
        let contentWithUpdatedImages = parsed.content
        const uploadedImages: Record<string, string> = {}

        for (const image of images) {
          try {
            const mediaDoc = await uploadImageToPayload(payload, image)
            uploadedImages[image.src] = mediaDoc.id

            // Replace image source with media ID reference in the content
            const escapedSrc = image.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            contentWithUpdatedImages = contentWithUpdatedImages.replace(
              new RegExp(`src=["']${escapedSrc}["']`, 'g'),
              `src="__MEDIA_ID_${mediaDoc.id}__"`
            )

            // Set first image as hero image
            if (!heroImageId) {
              heroImageId = mediaDoc.id
            }
          } catch (imageError) {
            console.error(`Failed to upload image ${image.src}:`, imageError)
          }
        }

        // Convert HTML content to proper Lexical format
        const lexicalContent = convertHTMLToPayloadLexical(contentWithUpdatedImages)

        // Create excerpt from HTML (strip tags and get first 200 chars)
        const excerptText = parsed.content
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200)

        // Prepare category IDs - handle both string and number IDs
        const categoryIds = matchedCategories.matched.map(c =>
          typeof c.id === 'string' ? parseInt(c.id) : c.id
        )

        // Create the post
        const post = await payload.create({
          collection: 'posts',
          data: {
            title: parsed.title,
            excerpt: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: excerptText,
                      },
                    ],
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                version: 1,
              },
            },
            content: lexicalContent,
            slug,
            categories: categoryIds,
            heroImage: heroImageId,
            publishedAt: new Date().toISOString(),
            _status: 'published',
          },
        })

        results.success.push({
          filename: file.name,
          postId: post.id,
          title: parsed.title,
          slug: slug,
          categories: matchedCategories.matched.map(c => c.title),
          unmatchedCategories: matchedCategories.unmatched,
          imagesUploaded: Object.keys(uploadedImages).length,
        })
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error)
        results.failed.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: files.length,
        successful: results.success.length,
        failed: results.failed.length,
        warnings: results.warnings.length,
      },
    })
  } catch (error) {
    console.error('HTML import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}
