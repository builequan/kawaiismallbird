import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('name')
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }
    
    const downloadsDir = '/Users/builequan/Downloads'
    const filePath = path.resolve(downloadsDir, fileName)
    
    // Security check: ensure file is in Downloads directory
    if (!filePath.startsWith(downloadsDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }
    
    // Check if file exists
    await fs.access(filePath)
    
    // Read and parse JSON file
    const content = await fs.readFile(filePath, 'utf-8')
    const jsonData = JSON.parse(content)
    
    return NextResponse.json(jsonData)
  } catch (error: any) {
    console.error('Read file error:', error)
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON file' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}