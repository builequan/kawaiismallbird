import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface FolderItem {
  name: string
  path: string
  isDirectory: boolean
  hasMarkdownFiles?: boolean
  markdownCount?: number
  hasImages?: boolean
  imageCount?: number
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { currentPath = os.homedir() } = body
    
    // Validate path exists and is accessible
    if (!fs.existsSync(currentPath)) {
      return NextResponse.json(
        { error: 'Path does not exist' },
        { status: 400 }
      )
    }
    
    const stats = fs.statSync(currentPath)
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is not a directory' },
        { status: 400 }
      )
    }
    
    // Get directory contents
    const items: FolderItem[] = []
    
    try {
      const files = fs.readdirSync(currentPath)
      
      for (const file of files) {
        // Skip hidden files and system folders
        if (file.startsWith('.') || file === 'node_modules' || file === 'Library') {
          continue
        }
        
        const fullPath = path.join(currentPath, file)
        
        try {
          const itemStats = fs.statSync(fullPath)
          
          if (itemStats.isDirectory()) {
            // Check if directory contains markdown files or images
            let hasMarkdownFiles = false
            let markdownCount = 0
            let hasImages = false
            let imageCount = 0
            
            try {
              const subFiles = fs.readdirSync(fullPath)
              markdownCount = subFiles.filter(f => f.endsWith('.md')).length
              hasMarkdownFiles = markdownCount > 0
              
              const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
              imageCount = subFiles.filter(f => 
                imageExtensions.some(ext => f.toLowerCase().endsWith(ext))
              ).length
              hasImages = imageCount > 0
            } catch (e) {
              // Can't read subdirectory, skip counts
            }
            
            items.push({
              name: file,
              path: fullPath,
              isDirectory: true,
              hasMarkdownFiles,
              markdownCount,
              hasImages,
              imageCount,
            })
          }
        } catch (e) {
          // Can't stat file, skip it
        }
      }
      
      // Sort: directories first, then alphabetically
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
      
    } catch (e) {
      return NextResponse.json(
        { error: 'Cannot read directory' },
        { status: 403 }
      )
    }
    
    // Get parent directory
    const parentDir = path.dirname(currentPath)
    const canGoUp = currentPath !== '/' && currentPath !== os.homedir()
    
    return NextResponse.json({
      currentPath,
      parentPath: canGoUp ? parentDir : null,
      items,
      homeDir: os.homedir(),
    })
    
  } catch (error) {
    console.error('Browse error:', error)
    return NextResponse.json(
      { error: 'Failed to browse folders' },
      { status: 500 }
    )
  }
}

// GET common paths
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const homeDir = os.homedir()
    const desktopDir = path.join(homeDir, 'Desktop')
    const documentsDir = path.join(homeDir, 'Documents')
    const downloadsDir = path.join(homeDir, 'Downloads')
    
    // Suggested paths based on your structure
    const suggestedPaths = [
      {
        name: 'WordPress Export (English)',
        path: '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress',
        type: 'markdown',
      },
      {
        name: 'WordPress Export (Japanese)',
        path: '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
        type: 'markdown',
      },
      {
        name: 'WordPress Images',
        path: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
        type: 'images',
      },
    ].filter(p => fs.existsSync(p.path))
    
    return NextResponse.json({
      commonPaths: [
        { name: 'Home', path: homeDir },
        { name: 'Desktop', path: desktopDir },
        { name: 'Documents', path: documentsDir },
        { name: 'Downloads', path: downloadsDir },
      ].filter(p => fs.existsSync(p.path)),
      suggestedPaths,
    })
    
  } catch (error) {
    console.error('Get paths error:', error)
    return NextResponse.json(
      { error: 'Failed to get common paths' },
      { status: 500 }
    )
  }
}