import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function freshImport() {
  console.log('Starting fresh import test...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Clear all categories
  console.log('\nClearing existing categories...')
  const existingCategories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })
  
  for (const cat of existingCategories.docs) {
    await payload.delete({
      collection: 'categories',
      id: cat.id,
    })
  }
  console.log(`Deleted ${existingCategories.docs.length} categories`)
  
  // Clear all posts  
  console.log('\nClearing existing posts...')
  const existingPosts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  for (const post of existingPosts.docs) {
    try {
      await payload.delete({
        collection: 'posts',
        id: post.id,
      })
    } catch (error) {
      // Ignore revalidation errors in script context
      console.log(`Note: Skipped revalidation for post ${post.id}`)
    }
  }
  console.log(`Deleted ${existingPosts.docs.length} posts`)
  
  // Import just one file to test
  console.log('\n=== Importing Single Test File ===')
  const fs = await import('fs')
  const path = await import('path')
  
  const testFolder = '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese'
  const testFile = 'golf-backswing-mistake-costs-strokes-ja.md'
  
  // Read the test file to see its categories
  const testContent = fs.readFileSync(path.join(testFolder, testFile), 'utf-8')
  const lines = testContent.split('\n').slice(0, 30)
  console.log('\nTest file frontmatter:')
  lines.forEach(line => {
    if (line.includes('categories:') || line.startsWith('  - ')) {
      console.log(line)
    }
  })
  
  // Create a temp folder with just this one file
  const tempFolder = '/tmp/test-import'
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder, { recursive: true })
  }
  fs.copyFileSync(path.join(testFolder, testFile), path.join(tempFolder, testFile))
  
  // Run import
  const result = await importWordPressContent({
    folderPath: tempFolder,
    imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
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
      console.log(`- ${detail.file}: ${detail.status} (${detail.title})`)
    })
  }
  
  if (result.errors.length > 0) {
    console.log('\nErrors:')
    result.errors.forEach(error => {
      console.log(`- ${error.file}: ${error.error}`)
    })
  }
  
  // Check categories created
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  
  console.log('\n=== Categories Created ===')
  console.log(`Total categories: ${categories.totalDocs}`)
  
  // Show all categories with details
  for (const cat of categories.docs) {
    let parentInfo = ''
    if (cat.parent) {
      if (typeof cat.parent === 'string') {
        const parent = categories.docs.find(p => p.id === cat.parent)
        if (parent) parentInfo = ` -> Parent: ${parent.title}`
      } else if (typeof cat.parent === 'object') {
        parentInfo = ` -> Parent: ${cat.parent.title}`
      }
    }
    console.log(`- ${cat.title} (slug: ${cat.slug})${parentInfo}`)
  }
  
  // Check the imported post's categories
  const posts = await payload.find({
    collection: 'posts',
    limit: 10,
  })
  
  if (posts.docs.length > 0) {
    console.log('\n=== Post Categories ===')
    const post = posts.docs[0]
    console.log(`Post: ${post.title}`)
    
    if (post.categories && post.categories.length > 0) {
      console.log('Categories assigned:')
      for (const catId of post.categories) {
        const category = categories.docs.find(c => c.id === catId)
        if (category) {
          console.log(`  - ${category.title} (${category.slug})`)
        }
      }
    } else {
      console.log('No categories assigned')
    }
  }
  
  process.exit(0)
}

freshImport().catch(error => {
  console.error('Error during import:', error)
  process.exit(1)
})