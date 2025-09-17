import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'

async function reimportPostsWithTables() {
  console.log('Starting to reimport posts with tables...')
  
  const payload = await getPayload({ config: configPromise })
  
  // First, identify posts that have tables
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
  })
  
  let postsWithTables: string[] = []
  
  // Check which posts have table content
  for (const post of posts.docs) {
    if (post.content?.root?.children) {
      const hasTable = post.content.root.children.some((node: any) => 
        node.type === 'table' || 
        (node.type === 'paragraph' && node.children?.[0]?.text?.includes(' | '))
      )
      
      if (hasTable) {
        postsWithTables.push(post.slug)
        console.log(`Found table in: ${post.title}`)
      }
    }
  }
  
  console.log(`\nFound ${postsWithTables.length} posts with tables`)
  
  if (postsWithTables.length === 0) {
    console.log('No posts with tables found')
    process.exit(0)
  }
  
  // Now reimport just those posts
  const sourceFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese'
  const imagesFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/images'
  
  let reimportedCount = 0
  let errorCount = 0
  
  for (const slug of postsWithTables) {
    // Find the corresponding markdown file
    const files = fs.readdirSync(sourceFolder)
    const matchingFile = files.find(file => {
      if (!file.endsWith('.md')) return false
      
      const content = fs.readFileSync(path.join(sourceFolder, file), 'utf-8')
      return content.includes(`slug: "${slug}"`)
    })
    
    if (matchingFile) {
      console.log(`\nReimporting: ${matchingFile}`)
      
      try {
        // Create temp folder with just this file
        const tempFolder = '/tmp/reimport-tables'
        if (!fs.existsSync(tempFolder)) {
          fs.mkdirSync(tempFolder, { recursive: true })
        }
        
        // Copy the file
        fs.copyFileSync(
          path.join(sourceFolder, matchingFile),
          path.join(tempFolder, matchingFile)
        )
        
        // Reimport
        const result = await importWordPressContent({
          folderPath: tempFolder,
          imagesFolder,
          dryRun: false,
          overwrite: true,
        })
        
        if (result.success && result.imported > 0) {
          console.log('  ✓ Reimported successfully')
          reimportedCount++
        } else {
          console.log('  ✗ Failed to reimport')
          errorCount++
        }
        
        // Clean up temp folder
        fs.rmSync(tempFolder, { recursive: true, force: true })
        
      } catch (error) {
        console.error(`  ✗ Error reimporting:`, error)
        errorCount++
      }
    } else {
      console.log(`Could not find markdown file for slug: ${slug}`)
    }
  }
  
  console.log('\n=== Summary ===')
  console.log(`Posts with tables: ${postsWithTables.length}`)
  console.log(`Successfully reimported: ${reimportedCount}`)
  console.log(`Errors: ${errorCount}`)
  
  process.exit(0)
}

reimportPostsWithTables().catch((error) => {
  console.error('Error reimporting posts:', error)
  process.exit(1)
})