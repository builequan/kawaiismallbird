import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check authentication (disabled for development - enable in production!)
    const payload = await getPayload({ config: configPromise })
    // const { user } = await payload.auth({ headers: request.headers })
    
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized. Please log in to manage internal links.' },
    //     { status: 401 }
    //   )
    // }
    
    // Parse request body
    const body = await request.json()
    const { postIds, all = false } = body
    
    // Validate input
    if (!all && (!postIds || !Array.isArray(postIds) || postIds.length === 0)) {
      return NextResponse.json(
        { error: 'Please provide postIds array or set all to true' },
        { status: 400 }
      )
    }
    
    // Build command based on request (using semantic links script with diverse targeting)
    let command = 'PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/internal-links/04-apply-semantic-links-fixed.ts --force'
    
    if (!all && postIds.length === 1) {
      // For single post, we would need to modify the script to accept --id parameter
      // For now, we'll use the limit parameter as a workaround
      command += ` --limit=${postIds.length}`
    } else if (!all) {
      // For multiple specific posts, we'd need to enhance the script
      command += ` --limit=${postIds.length}`
    }
    // If all is true, run without limits
    
    // Execute the script
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd()
    })
    
    // Parse the output to extract results
    const lines = stdout.split('\n')
    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const results = []
    
    for (const line of lines) {
      if (line.includes('Successfully processed:')) {
        const match = line.match(/(\d+)/)
        if (match) processedCount = parseInt(match[1])
      } else if (line.includes('Skipped:')) {
        const match = line.match(/(\d+)/)
        if (match) skippedCount = parseInt(match[1])
      } else if (line.includes('Errors:')) {
        const match = line.match(/(\d+)/)
        if (match) errorCount = parseInt(match[1])
      } else if (line.includes('Found') && line.includes('links for:')) {
        const match = line.match(/Found (\d+) links for: (.+)/)
        if (match) {
          results.push({
            postTitle: match[2],
            linksAdded: parseInt(match[1])
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Internal links processed successfully',
      stats: {
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount
      },
      results,
      output: stdout
    })
    
  } catch (error: any) {
    console.error('Error processing internal links:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process internal links',
        details: error.message 
      },
      { status: 500 }
    )
  }
}