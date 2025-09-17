import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Run the build and compute pipeline
    const scripts = [
      '01-build-index.ts',
      '03-compute-similarity-keywords.ts', // Using keyword-only version (faster)
    ]
    
    let products = 0
    let posts = 0
    let postsWithProducts = 0
    
    for (const script of scripts) {
      const command = `PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer pnpm tsx scripts/affiliate-links/${script}`
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutes per script
      })
      
      // Parse output for statistics
      if (script === '01-build-index.ts') {
        const productMatch = stdout.match(/Products indexed: (\d+)/)
        const postMatch = stdout.match(/Posts indexed: (\d+)/)
        if (productMatch) products = parseInt(productMatch[1])
        if (postMatch) posts = parseInt(postMatch[1])
      }
      
      if (script === '03-compute-similarity-keywords.ts') {
        const matchedMatch = stdout.match(/Posts with products: (\d+)/)
        if (matchedMatch) postsWithProducts = parseInt(matchedMatch[1])
      }
    }
    
    return NextResponse.json({
      success: true,
      products,
      posts,
      postsWithProducts,
      message: `Index rebuilt: ${products} products, ${posts} posts, ${postsWithProducts} posts matched`,
    })
  } catch (error: any) {
    console.error('Rebuild error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Rebuild failed',
        details: error.message,
      },
      { status: 500 }
    )
  }
}