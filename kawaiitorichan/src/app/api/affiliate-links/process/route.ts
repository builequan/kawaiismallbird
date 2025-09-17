import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { all = false, limit } = body
    
    // Build command - use contextual linking with proper word boundaries (no partial matches)
    let command = 'PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/affiliate-links/04-apply-contextual-links-fixed.ts'
    
    if (limit) {
      command += ` --limit ${limit}`
    }
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minutes
    })
    
    // Parse output
    const lines = stdout.split('\n')
    let processed = 0
    let skipped = 0
    let errors = 0
    
    for (const line of lines) {
      if (line.includes('Processed:')) {
        const match = line.match(/Processed: (\d+)/)
        if (match) processed = parseInt(match[1])
      } else if (line.includes('Skipped:')) {
        const match = line.match(/Skipped: (\d+)/)
        if (match) skipped = parseInt(match[1])
      } else if (line.includes('Errors:')) {
        const match = line.match(/Errors: (\d+)/)
        if (match) errors = parseInt(match[1])
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      skipped,
      errors,
      message: `Processing complete: ${processed} processed, ${skipped} skipped`,
    })
  } catch (error: any) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Processing failed',
        details: error.message,
      },
      { status: 500 }
    )
  }
}