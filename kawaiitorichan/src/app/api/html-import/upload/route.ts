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

    // Separate HTML files from image files
    const htmlFiles: File[] = []
    const imageFiles: File[] = []

    console.log(`[UPLOAD] Received ${files.length} total files:`)
    for (const file of files) {
      console.log(`  - ${file.name} (type: ${file.type}, size: ${file.size})`)
      if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        htmlFiles.push(file)
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)) {
        imageFiles.push(file)
      }
    }

    console.log(`[UPLOAD] Categorized: ${htmlFiles.length} HTML files, ${imageFiles.length} image files`)
    console.log(`[UPLOAD] HTML files: ${htmlFiles.map(f => f.name).join(', ')}`)
    console.log(`[UPLOAD] Image files: ${imageFiles.map(f => f.name).join(', ')}`)

    // Step 1: Upload all image files and create filename -> media ID mapping
    const imageMapping: Record<string, string> = {}

    for (const imageFile of imageFiles) {
      try {
        console.log(`[UPLOAD] Uploading image file: ${imageFile.name}`)

        // Read the image file
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const file = new File([buffer], imageFile.name, { type: imageFile.type })

        // Upload to Payload
        const mediaDoc = await payload.create({
          collection: 'media',
          data: {
            alt: imageFile.name.replace(/\.[^.]+$/, ''),
          },
          file,
        })

        imageMapping[imageFile.name] = mediaDoc.id
        console.log(`[UPLOAD] Uploaded ${imageFile.name} with ID: ${mediaDoc.id}`)
      } catch (error) {
        console.error(`[UPLOAD] Failed to upload image ${imageFile.name}:`, error)
      }
    }

    console.log(`[UPLOAD] Image mapping created with ${Object.keys(imageMapping).length} images`)

    // Step 2: Process each HTML file
    for (const file of htmlFiles) {
      try {

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

        // Replace relative image paths with uploaded media IDs
        let heroImageId = null
        let contentWithUpdatedImages = parsed.content

        // Find all img tags in the content
        const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
        let match
        const imageSources: string[] = []

        while ((match = imgRegex.exec(parsed.content)) !== null) {
          imageSources.push(match[1])
        }

        console.log(`[IMAGE DEBUG] Found ${imageSources.length} image references in HTML`)

        for (const src of imageSources) {
          // Extract just the filename (handle relative paths like ./, ../, or just filename)
          const filename = src.split('/').pop() || src
          console.log(`[IMAGE DEBUG] Processing image src="${src}", filename="${filename}"`)

          // Check if we have this image uploaded
          if (imageMapping[filename]) {
            const mediaId = imageMapping[filename]
            console.log(`[IMAGE DEBUG] Found uploaded image: ${filename} -> ${mediaId}`)

            // Replace all occurrences of this src with the media ID marker
            const searchPatterns = [
              `src="${src}"`,
              `src='${src}'`,
            ]

            for (const pattern of searchPatterns) {
              if (contentWithUpdatedImages.includes(pattern)) {
                const replaceStr = `src="__MEDIA_ID_${mediaId}__"`
                contentWithUpdatedImages = contentWithUpdatedImages.split(pattern).join(replaceStr)
                console.log(`[IMAGE DEBUG] Replaced "${pattern}" with media ID ${mediaId}`)
              }
            }

            // Set first image as hero image
            if (!heroImageId) {
              heroImageId = mediaId
              console.log(`[IMAGE DEBUG] Set hero image: ${mediaId}`)
            }
          } else {
            console.log(`[IMAGE DEBUG] No uploaded file found for: ${filename}`)
          }
        }

        // Also handle any base64 or external URLs
        const images = extractImagesFromHTML(parsed.content)
        for (const image of images) {
          if (image.isBase64 || image.src.startsWith('http')) {
            try {
              console.log(`[IMAGE DEBUG] Uploading ${image.isBase64 ? 'base64' : 'external'} image`)
              const mediaDoc = await uploadImageToPayload(payload, image)

              // Replace in content
              const searchStr = `src="${image.src}"`
              if (contentWithUpdatedImages.includes(searchStr)) {
                contentWithUpdatedImages = contentWithUpdatedImages.split(searchStr).join(`src="__MEDIA_ID_${mediaDoc.id}__"`)
                console.log(`[IMAGE DEBUG] Replaced ${image.isBase64 ? 'base64' : 'external'} image with ID ${mediaDoc.id}`)
              }

              if (!heroImageId) {
                heroImageId = mediaDoc.id
              }
            } catch (error) {
              console.error(`[IMAGE DEBUG] Failed to upload image:`, error)
            }
          }
        }

        console.log(`[IMAGE DEBUG] Final content includes __MEDIA_ID_: ${contentWithUpdatedImages.includes('__MEDIA_ID_')}`)

        // Convert HTML content to proper Lexical format
        const lexicalContent = convertHTMLToPayloadLexical(contentWithUpdatedImages)

        // Log the generated content structure
        console.log('Generated Lexical content:', JSON.stringify(lexicalContent, null, 2).substring(0, 1000))

        // DEBUG: Check for any link nodes in the content
        const findLinkNodes = (node: any): any[] => {
          const links: any[] = []
          if (node.type === 'link') {
            links.push(node)
          }
          if (node.children && Array.isArray(node.children)) {
            node.children.forEach((child: any) => {
              links.push(...findLinkNodes(child))
            })
          }
          return links
        }

        const linkNodes = findLinkNodes(lexicalContent.root)
        if (linkNodes.length > 0) {
          console.log(`WARN: Found ${linkNodes.length} link nodes in generated content:`)
          linkNodes.forEach((ln, i) => {
            console.log(`  Link ${i}:`, JSON.stringify(ln))
          })
        }

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

        // Create the post - start with minimal fields to debug
        try {
          console.log('About to create post with data:', {
            title: parsed.title ? `"${parsed.title.substring(0, 50)}"` : 'UNDEFINED',
            slug: slug ? `"${slug}"` : 'UNDEFINED',
            contentRoot: lexicalContent?.root ? 'EXISTS' : 'MISSING',
            contentRootChildren: lexicalContent?.root?.children?.length || 0,
          })

          console.log(`[POST CREATE] About to create post with:`)
          console.log(`  - title: ${parsed.title}`)
          console.log(`  - slug: ${slug}`)
          console.log(`  - heroImageId: ${heroImageId || 'NONE'}`)
          console.log(`  - lexical root children count: ${lexicalContent?.root?.children?.length || 0}`)

          const post = await payload.create({
            collection: 'posts',
            data: {
              title: parsed.title,
              content: lexicalContent,
              slug,
              publishedAt: new Date().toISOString(),
              _status: 'published',
              ...(excerptText && { excerpt: { root: { type: 'root', format: '', indent: 0, version: 1, children: [{ type: 'paragraph', format: '', indent: 0, version: 1, children: [{ mode: 'normal', text: excerptText, type: 'text', style: '', detail: 0, format: 0, version: 1 }], direction: 'ltr' }] } } }),
              ...(categoryIds.length > 0 && { categories: categoryIds }),
              ...(heroImageId && { heroImage: heroImageId }),
            },
          })

          console.log(`[POST CREATE] Successfully created post ${post.id}`)
          console.log(`  - heroImage in response: ${JSON.stringify(post.heroImage)}`)
          console.log(`  - content root children: ${post.content?.root?.children?.length || 0}`)

          // Count upload nodes in content
          const countUploads = (node: any): number => {
            if (!node) return 0
            if (node.type === 'upload') return 1
            if (node.children && Array.isArray(node.children)) {
              return node.children.reduce((sum: number, child: any) => sum + countUploads(child), 0)
            }
            return 0
          }
          const uploadCount = countUploads(post.content?.root)
          console.log(`  - Upload nodes in content: ${uploadCount}`)

          results.success.push({
            filename: file.name,
            postId: post.id,
            title: parsed.title,
            slug: slug,
            imagesUploaded: Object.keys(uploadedImages).length,
          })
        } catch (createError: any) {
          console.error('Payload create error details:', {
            message: createError.message,
            errors: createError.errors,
            data: createError.data,
            statusCode: createError.statusCode,
            stack: createError.stack,
          })
          console.error('Full error object:', JSON.stringify(createError, null, 2))
          throw createError
        }
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
