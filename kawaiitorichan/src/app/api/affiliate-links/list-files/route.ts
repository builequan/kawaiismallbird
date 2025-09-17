import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

interface FileInfo {
  name: string
  size: number
  sizeFormatted: string
  dateModified: string
  dateFormatted: string
  productCount?: number
  source?: string
  preview?: any[]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function getFilePreview(filePath: string): Promise<{
  productCount?: number
  source?: string
  preview?: any[]
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    
    let products: any[] = []
    let source = 'Unknown'
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      products = data
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products
      if (data.folder?.name) {
        source = data.folder.name
      }
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items
    }
    
    return {
      productCount: products.length,
      source,
      preview: products.slice(0, 3).map(p => ({
        name: p.product_name || p.name || p.title || 'Unnamed',
        price: p.price || 'N/A',
        keyword: p.keyword_research || p.keyword || '',
      })),
    }
  } catch (error) {
    console.error(`Error reading file preview for ${filePath}:`, error)
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Downloads directory path
    const downloadsDir = '/Users/builequan/Downloads'
    
    // Check if directory exists
    try {
      await fs.access(downloadsDir)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Downloads folder not accessible',
        files: [],
      })
    }
    
    // List all files in the directory
    const allFiles = await fs.readdir(downloadsDir)
    
    // Filter for JSON files
    let jsonFiles = allFiles.filter(file => {
      if (!file.endsWith('.json')) return false
      if (filter) {
        return file.toLowerCase().includes(filter.toLowerCase())
      }
      // Default: show affiliate and review files
      return file.startsWith('affiliate_products_') || 
             file.startsWith('review_topics_') ||
             file.includes('products') ||
             file.includes('affiliate')
    })
    
    // Get file stats and preview
    const fileInfoPromises = jsonFiles.map(async (fileName) => {
      const filePath = path.join(downloadsDir, fileName)
      const stats = await fs.stat(filePath)
      const preview = await getFilePreview(filePath)
      
      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        dateModified: stats.mtime.toISOString(),
        dateFormatted: formatDate(stats.mtime),
        ...preview,
      } as FileInfo
    })
    
    let files = await Promise.all(fileInfoPromises)
    
    // Sort files
    files.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      } else if (sortBy === 'size') {
        return sortOrder === 'asc'
          ? a.size - b.size
          : b.size - a.size
      } else { // date
        const dateA = new Date(a.dateModified).getTime()
        const dateB = new Date(b.dateModified).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
    })
    
    return NextResponse.json({
      success: true,
      files,
      directory: downloadsDir,
      totalFiles: files.length,
    })
  } catch (error: any) {
    console.error('List files error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list files',
        details: error.message,
      },
      { status: 500 }
    )
  }
}