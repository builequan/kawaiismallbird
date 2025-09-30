import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mediaId = params.id
    console.log(`[media-by-id] Fetching media with ID: ${mediaId}`)

    // Get Payload instance
    const payload = await getPayload({ config: configPromise })

    // Query the media collection for this ID
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
    })

    if (!media) {
      console.error(`[media-by-id] Media not found in database: ${mediaId}`)
      return new NextResponse('Media not found in database', { status: 404 })
    }

    console.log(`[media-by-id] Found media:`, {
      id: media.id,
      filename: media.filename,
      mimeType: media.mimeType,
    })

    // Get the filename from the media record
    const fileName = media.filename

    if (!fileName) {
      console.error(`[media-by-id] No filename in media record: ${mediaId}`)
      return new NextResponse('No filename in media record', { status: 500 })
    }

    // Try multiple locations for the file
    let filePath: string | null = null
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'media', fileName),
      path.join(process.cwd(), '.next', 'static', 'media', fileName),
      path.join('/app', 'public', 'media', fileName),
    ]

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath
        console.log(`[media-by-id] Found file at: ${testPath}`)
        break
      }
    }

    if (!filePath) {
      console.error(`[media-by-id] File not found in any location:`, possiblePaths)
      return new NextResponse(`File not found: ${fileName}`, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Use the mimeType from the database or determine from extension
    let contentType = media.mimeType || 'application/octet-stream'

    // Fallback to extension-based detection if no mimeType
    if (!media.mimeType) {
      const ext = path.extname(fileName).toLowerCase()
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
        case '.svg':
          contentType = 'image/svg+xml'
          break
      }
    }

    console.log(`[media-by-id] Serving file: ${fileName} (${contentType})`)

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[media-by-id] Error serving media file:', error)
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}