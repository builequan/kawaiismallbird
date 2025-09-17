import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { files = [] } = body
    
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No files specified for deletion',
        },
        { status: 400 }
      )
    }
    
    const downloadsDir = '/Users/builequan/Downloads'
    let deletedFiles: string[] = []
    let failedFiles: { file: string; error: string }[] = []
    
    for (const fileName of files) {
      try {
        // Security: Ensure file is in Downloads directory
        const filePath = path.resolve(downloadsDir, fileName)
        if (!filePath.startsWith(downloadsDir)) {
          throw new Error('Invalid file path - outside Downloads directory')
        }
        
        // Check if file exists
        await fs.access(filePath)
        
        // Delete the file
        await fs.unlink(filePath)
        deletedFiles.push(fileName)
        console.log(`✅ Deleted: ${fileName}`)
      } catch (error: any) {
        console.error(`❌ Failed to delete ${fileName}:`, error.message)
        failedFiles.push({
          file: fileName,
          error: error.message,
        })
      }
    }
    
    const message = deletedFiles.length > 0
      ? `Successfully deleted ${deletedFiles.length} file(s)`
      : 'No files were deleted'
    
    return NextResponse.json({
      success: true,
      deletedFiles,
      failedFiles,
      totalRequested: files.length,
      totalDeleted: deletedFiles.length,
      totalFailed: failedFiles.length,
      message,
    })
  } catch (error: any) {
    console.error('Delete files error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete files',
        details: error.message,
      },
      { status: 500 }
    )
  }
}