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
    
    // If removing all links, use the simple-remove-all script
    if (all) {
      const command = 'PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/internal-links/simple-remove-all.ts'
      
      try {
        const { stdout } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 60000 // 60 second timeout
        })
        
        // Parse the output
        const removedMatch = stdout.match(/Links removed from: (\d+) posts/)
        const removedCount = removedMatch ? parseInt(removedMatch[1]) : 0
        
        return NextResponse.json({
          success: true,
          message: `Successfully removed all internal links`,
          stats: {
            removed: removedCount,
            noLinks: 0
          },
          output: stdout
        })
      } catch (error: any) {
        console.error('Error executing remove all:', error)
        throw error
      }
    }
    
    // Build command for specific posts
    let command = 'PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/internal-links/remove-links.ts'
    
    if (postIds.length === 1) {
      command += ` --id ${postIds[0]}`
    } else {
      // For multiple posts, we'd need to run multiple commands or enhance the script
      // For now, we'll process them one by one
      const results = []
      for (const postId of postIds) {
        const singleCommand = `${command} --id ${postId}`
        const { stdout } = await execAsync(singleCommand, { cwd: process.cwd() })
        results.push({ postId, output: stdout })
      }
      
      return NextResponse.json({
        success: true,
        message: `Removed links from ${postIds.length} posts`,
        results
      })
    }
    
    // Execute the script
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd()
    })
    
    // Parse output
    const lines = stdout.split('\n')
    let removedCount = 0
    let noLinksCount = 0
    
    for (const line of lines) {
      if (line.includes('Links removed from:')) {
        const match = line.match(/(\d+)/)
        if (match) removedCount = parseInt(match[1])
      } else if (line.includes('No links found in:')) {
        const match = line.match(/(\d+)/)
        if (match) noLinksCount = parseInt(match[1])
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Internal links removed successfully',
      stats: {
        removed: removedCount,
        noLinks: noLinksCount
      },
      output: stdout
    })
    
  } catch (error: any) {
    console.error('Error removing internal links:', error)
    return NextResponse.json(
      { 
        error: 'Failed to remove internal links',
        details: error.message 
      },
      { status: 500 }
    )
  }
}