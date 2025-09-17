import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'

async function testSingleImport() {
  console.log('=== Starting Single File Import Test ===\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Test file details - using the specific file you mentioned
  const testFile = 'golf-downswing-power-accuracy-secret-ja.md'
  const sourceFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese'
  const imagesFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/images'
  
  console.log(`Test File: ${testFile}`)
  console.log(`Source: ${sourceFolder}`)
  console.log(`Images: ${imagesFolder}\n`)
  
  // Check if files exist
  const filePath = path.join(sourceFolder, testFile)
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }
  
  // Read file content for preview
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  console.log('=== File Preview ===')
  console.log('First 10 lines:')
  lines.slice(0, 10).forEach(line => console.log(line))
  
  // Extract metadata
  const metadataEnd = lines.findIndex((line, idx) => idx > 0 && line === '---')
  if (metadataEnd > 0) {
    console.log('\n=== Metadata Found ===')
    const metadata = lines.slice(1, metadataEnd)
    metadata.forEach(line => {
      if (line.includes('title:') || line.includes('featured_image:') || line.includes('categories:')) {
        console.log(line)
      }
    })
  }
  
  // Check for mermaid diagrams
  const mermaidCount = (content.match(/```mermaid/gi) || []).length
  console.log(`\n=== Content Analysis ===`)
  console.log(`Mermaid diagrams found: ${mermaidCount}`)
  
  // Check for images
  const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []
  console.log(`Images found: ${imageMatches.length}`)
  if (imageMatches.length > 0) {
    console.log('Image references:')
    imageMatches.slice(0, 3).forEach(img => console.log(`  - ${img}`))
  }
  
  // Check if hero image exists
  const heroImageMatch = content.match(/featured_image:\s*"([^"]+)"/)
  if (heroImageMatch) {
    const heroImagePath = path.join(imagesFolder, path.basename(heroImageMatch[1]))
    console.log(`\nHero image: ${path.basename(heroImageMatch[1])}`)
    console.log(`Hero image exists: ${fs.existsSync(heroImagePath)}`)
  }
  
  // Clear existing test post if it exists
  console.log('\n=== Preparing Import ===')
  const slug = 'golf-downswing-power-accuracy-secret'
  const existingPost = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
    },
  })
  
  if (existingPost.docs.length > 0) {
    console.log(`Found existing post with slug: ${slug}`)
    console.log('Deleting existing post...')
    for (const post of existingPost.docs) {
      await payload.delete({
        collection: 'posts',
        id: post.id,
      })
    }
    console.log('Existing post deleted')
  }
  
  // Create temp folder with just this file
  const tempFolder = '/tmp/test-wordpress-import'
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder, { recursive: true })
  }
  fs.copyFileSync(filePath, path.join(tempFolder, testFile))
  
  // Run the import
  console.log('\n=== Running Import ===')
  console.log('Importing from temp folder...')
  
  try {
    const result = await importWordPressContent({
      folderPath: tempFolder,
      imagesFolder: imagesFolder,
      dryRun: false,
      overwrite: true,
    })
    
    console.log('\n=== Import Results ===')
    console.log(`Success: ${result.success}`)
    console.log(`Imported: ${result.imported}`)
    console.log(`Failed: ${result.failed}`)
    
    if (result.details.length > 0) {
      console.log('\nImport details:')
      result.details.forEach(detail => {
        console.log(`- ${detail.file}: ${detail.status}`)
        console.log(`  Title: ${detail.title}`)
        console.log(`  Slug: ${detail.slug}`)
      })
    }
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:')
      result.errors.forEach(error => {
        console.log(`- ${error.file}: ${error.error}`)
      })
    }
    
    // Verify the import
    console.log('\n=== Verifying Import ===')
    
    // Check if post was created
    const importedPost = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: slug,
        },
      },
      depth: 2,
    })
    
    if (importedPost.docs.length > 0) {
      const post = importedPost.docs[0]
      console.log('Post successfully imported!')
      console.log(`- ID: ${post.id}`)
      console.log(`- Title: ${post.title}`)
      console.log(`- Language: ${post.language}`)
      console.log(`- Status: ${post._status}`)
      console.log(`- Hero Image: ${post.heroImage ? 'Yes' : 'No'}`)
      
      // Check categories
      if (post.categories && post.categories.length > 0) {
        console.log(`- Categories: ${post.categories.length}`)
        post.categories.forEach((cat: any) => {
          if (typeof cat === 'object' && cat.title) {
            console.log(`  - ${cat.title}`)
          }
        })
      }
      
      // Check content structure
      if (post.content && post.content.root) {
        const content = post.content.root.children
        console.log(`\n=== Content Structure ===`)
        console.log(`Total nodes: ${content.length}`)
        
        // Count different node types
        const nodeTypes: Record<string, number> = {}
        content.forEach((node: any) => {
          const type = node.type === 'block' ? `block:${node.fields?.blockType}` : node.type
          nodeTypes[type] = (nodeTypes[type] || 0) + 1
        })
        
        console.log('Node types:')
        Object.entries(nodeTypes).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`)
        })
        
        // Check for code blocks (including Mermaid)
        const codeBlocks = content.filter((node: any) => 
          node.type === 'block' && node.fields?.blockType === 'code'
        )
        
        if (codeBlocks.length > 0) {
          console.log(`\n=== Code Blocks Found ===`)
          codeBlocks.forEach((block: any, index: number) => {
            console.log(`Code Block ${index + 1}:`)
            console.log(`  Language: ${block.fields.language}`)
            const preview = block.fields.code.substring(0, 50).replace(/\n/g, ' ')
            console.log(`  Code preview: ${preview}...`)
            if (block.fields.language === 'mermaid') {
              console.log(`  ✓ This is a Mermaid diagram (editable as code)`)
            }
          })
        }
      }
      
      // Check media
      const mediaCount = await payload.count({
        collection: 'media',
      })
      console.log(`\n=== Media Collection ===`)
      console.log(`Total media items: ${mediaCount.totalDocs}`)
      
      // Check recently uploaded media
      const recentMedia = await payload.find({
        collection: 'media',
        limit: 5,
        sort: '-createdAt',
      })
      
      if (recentMedia.docs.length > 0) {
        console.log('Recent uploads:')
        recentMedia.docs.forEach((media: any) => {
          console.log(`  - ${media.filename || 'Unknown'} (${media.alt || 'No alt text'})`)
        })
      }
    } else {
      console.log('Post was not found after import!')
    }
    
  } catch (error) {
    console.error('Import failed:', error)
  }
  
  // Cleanup
  fs.rmSync(tempFolder, { recursive: true, force: true })
  console.log('\n=== Test Complete ===')
  
  process.exit(0)
}

testSingleImport().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})