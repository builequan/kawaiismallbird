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
    //     { error: 'Unauthorized. Please log in to rebuild index.' },
    //     { status: 401 }
    //   )
    // }
    
    // Parse request body
    const body = await request.json()
    const { 
      rebuildIndex = true, 
      generateEmbeddings = true, 
      computeSimilarity = true,
      applyLinks = false 
    } = body
    
    const results = []
    const baseEnv = 'PAYLOAD_SECRET=your-secret-key-here DATABASE_URI=postgres://postgres:2801@127.0.0.1:5432/golfer'
    
    try {
      // Step 1: Rebuild index (using FIXED version with proper phrase extraction)
      if (rebuildIndex) {
        console.log('Rebuilding post index with FIXED phrase extraction...')
        const { stdout } = await execAsync(
          `${baseEnv} pnpm tsx scripts/internal-links/01-build-index-fixed.ts`,
          { 
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            timeout: 60000 // 60 second timeout
          }
        )
        
        // Parse output for stats
        const indexedMatch = stdout.match(/Total posts indexed: (\d+)/)
        const indexedCount = indexedMatch ? parseInt(indexedMatch[1]) : 0
        
        results.push({
          step: 'buildIndex',
          success: true,
          message: `Indexed ${indexedCount} posts`,
          postsProcessed: indexedCount
        })
      }
      
      // Step 2: Generate embeddings (using Python script)
      if (generateEmbeddings) {
        console.log('Generating embeddings...')
        const { stdout } = await execAsync(
          `python3 scripts/internal-links/generate-embeddings-correct.py`,
          { 
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10,
            timeout: 60000
          }
        )
        
        // Parse output
        const embeddingsMatch = stdout.match(/Total embeddings: (\d+)/)
        const embeddingsCount = embeddingsMatch ? parseInt(embeddingsMatch[1]) : 0
        
        results.push({
          step: 'generateEmbeddings',
          success: true,
          message: `Generated ${embeddingsCount} embeddings`,
          embeddingsGenerated: embeddingsCount
        })
      }
      
      // Step 3: Compute similarity (using fixed script)
      if (computeSimilarity) {
        console.log('Computing similarity matrix...')
        const { stdout } = await execAsync(
          `${baseEnv} pnpm tsx scripts/internal-links/03-compute-similarity-fixed.ts`,
          { 
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10,
            timeout: 60000
          }
        )
        
        // Parse output
        const processedMatch = stdout.match(/Total posts processed: (\d+)/)
        const processedCount = processedMatch ? parseInt(processedMatch[1]) : 0
        
        results.push({
          step: 'computeSimilarity',
          success: true,
          message: `Computed similarities for ${processedCount} posts`,
          postsProcessed: processedCount
        })
      }
      
      // Step 4: Apply links (optional)
      if (applyLinks) {
        console.log('Applying backlinks...')
        const { stdout } = await execAsync(
          `${baseEnv} pnpm tsx scripts/internal-links/04-apply-backlinks.ts`,
          { 
            cwd: process.cwd(),
            maxBuffer: 1024 * 1024 * 10,
            timeout: 120000 // 2 minute timeout for applying links
          }
        )
        
        // Parse output
        const successMatch = stdout.match(/Successfully processed: (\d+)/)
        const successCount = successMatch ? parseInt(successMatch[1]) : 0
        
        results.push({
          step: 'applyBacklinks',
          success: true,
          message: `Applied links to ${successCount} posts`,
          postsProcessed: successCount
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Index rebuild completed successfully',
        results,
        timestamp: new Date().toISOString()
      })
      
    } catch (stepError: any) {
      console.error('Error during rebuild step:', stepError)
      
      return NextResponse.json({
        success: false,
        message: 'Rebuild partially completed with errors',
        results,
        error: stepError.message
      })
    }
    
  } catch (error: any) {
    console.error('Error rebuilding index:', error)
    return NextResponse.json(
      { 
        error: 'Failed to rebuild index',
        details: error.message 
      },
      { status: 500 }
    )
  }
}