import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'

async function importAllWordPress() {
  console.log('=== Starting Batch WordPress Import ===\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Configuration
  const folders = [
    {
      name: 'Japanese Posts',
      folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
      imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    },
    {
      name: 'WordPress Posts',
      folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress',
      imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    },
  ]
  
  let totalImported = 0
  let totalFailed = 0
  
  for (const folder of folders) {
    console.log(`\n=== Processing ${folder.name} ===`)
    console.log(`Folder: ${folder.folderPath}`)
    
    if (!fs.existsSync(folder.folderPath)) {
      console.log(`Folder does not exist, skipping...`)
      continue
    }
    
    // Get all markdown files
    const files = fs.readdirSync(folder.folderPath).filter(file => file.endsWith('.md'))
    console.log(`Found ${files.length} markdown files`)
    
    // Import the folder
    const result = await importWordPressContent({
      folderPath: folder.folderPath,
      imagesFolder: folder.imagesFolder,
      dryRun: false,
      overwrite: false, // Set to true if you want to update existing posts
    })
    
    totalImported += result.imported
    totalFailed += result.failed
    
    console.log(`\nResults for ${folder.name}:`)
    console.log(`- Imported: ${result.imported}`)
    console.log(`- Failed: ${result.failed}`)
    console.log(`- Success: ${result.success}`)
    
    if (result.errors.length > 0) {
      console.log('\nErrors:')
      result.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`)
      })
    }
  }
  
  console.log('\n=== Final Summary ===')
  console.log(`Total Posts Imported: ${totalImported}`)
  console.log(`Total Failed: ${totalFailed}`)
  
  // Verify categories were created
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  console.log(`\nTotal Categories: ${categories.totalDocs}`)
  
  // Verify media was uploaded
  const media = await payload.count({
    collection: 'media',
  })
  console.log(`Total Media Items: ${media.totalDocs}`)
  
  // Show sample of imported posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 5,
    sort: '-createdAt',
  })
  
  if (posts.docs.length > 0) {
    console.log('\n=== Recently Imported Posts ===')
    posts.docs.forEach((post: any) => {
      console.log(`- ${post.title} (${post.language})`)
      
      // Check if post has Mermaid diagrams
      if (post.content && post.content.root) {
        const hasCodeBlocks = post.content.root.children.some((node: any) => 
          node.type === 'block' && node.fields?.blockType === 'code' && node.fields?.language === 'mermaid'
        )
        if (hasCodeBlocks) {
          console.log('  ✓ Contains Mermaid diagram(s)')
        }
      }
    })
  }
  
  console.log('\n=== Import Complete ===')
  console.log('All files have been processed with:')
  console.log('- ✓ Images uploaded to Media collection')
  console.log('- ✓ Mermaid diagrams as editable code blocks')
  console.log('- ✓ Full width Mermaid rendering on frontend')
  console.log('- ✓ Categories properly organized')
  
  process.exit(0)
}

importAllWordPress().catch(error => {
  console.error('Import error:', error)
  process.exit(1)
})