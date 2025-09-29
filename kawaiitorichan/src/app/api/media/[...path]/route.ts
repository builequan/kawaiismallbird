import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the full file path - check both possible locations
    let fileName = params.path.join('/')

    // Remove 'file/' prefix if it exists (legacy URL format)
    if (fileName.startsWith('file/')) {
      fileName = fileName.substring(5)
    }

    // Try public/media first (development)
    let filePath = path.join(process.cwd(), 'public', 'media', fileName)

    // In production/standalone, files might be in different location
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), '.next', 'static', 'media', fileName)
    }

    // Also check the app directory itself
    if (!fs.existsSync(filePath)) {
      filePath = path.join('/app', 'public', 'media', fileName)
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Media file not found: ${filePath}`)
      return new NextResponse('File not found', { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Get file extension for content type
    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream'

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

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving media file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}