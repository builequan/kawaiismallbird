import { NextRequest, NextResponse } from 'next/server'
import { importWordPressContent, batchImportWordPress } from '@/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to import content.' },
        { status: 401 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { 
      folderPath, 
      imagesFolder, 
      dryRun = false, 
      overwrite = false,
      removeDuplicates = true,
      folders // For batch import
    } = body
    
    // Validate input
    if (!folders && (!folderPath || !imagesFolder)) {
      return NextResponse.json(
        { error: 'Missing required fields: folderPath and imagesFolder' },
        { status: 400 }
      )
    }
    
    // Perform import
    let result
    
    if (folders && Array.isArray(folders)) {
      // Batch import
      result = await batchImportWordPress(folders, { dryRun, overwrite, removeDuplicates })
    } else {
      // Single folder import
      result = await importWordPressContent({
        folderPath,
        imagesFolder,
        dryRun,
        overwrite,
        removeDuplicates,
      })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { 
        error: 'Import failed', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check import status and get configuration
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
    
    // Return import configuration and status
    return NextResponse.json({
      status: 'ready',
      supportedFormats: ['.md'],
      features: {
        dryRun: true,
        overwrite: true,
        batchImport: true,
      },
      paths: {
        defaultImagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
        sampleFolders: [
          '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
          '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress',
        ],
      },
    })
    
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    )
  }
}