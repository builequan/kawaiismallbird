import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function importAll() {
  console.log('=== Starting Full WordPress Import ===\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Clear existing data
  console.log('Clearing existing data...')
  
  // Clear categories
  const categories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })
  
  for (const cat of categories.docs) {
    await payload.delete({
      collection: 'categories',
      id: cat.id,
    })
  }
  console.log(`Cleared ${categories.docs.length} categories`)
  
  // Clear posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  for (const post of posts.docs) {
    try {
      await payload.delete({
        collection: 'posts',
        id: post.id,
      })
    } catch (error) {
      // Ignore revalidation errors
    }
  }
  console.log(`Cleared ${posts.docs.length} posts`)
  
  // Import Japanese content
  console.log('\n=== Importing Japanese Content ===')
  const japaneseResult = await importWordPressContent({
    folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
    imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    dryRun: false,
    overwrite: true,
  })
  
  console.log(`\nJapanese Import Results:`)
  console.log(`- Success: ${japaneseResult.success}`)
  console.log(`- Imported: ${japaneseResult.imported}`)
  console.log(`- Failed: ${japaneseResult.failed}`)
  
  if (japaneseResult.failed > 0) {
    console.log('\nFailed imports:')
    japaneseResult.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`)
    })
  }
  
  // Show sample of imported posts
  console.log('\nSample imported posts:')
  japaneseResult.details.slice(0, 5).forEach(detail => {
    console.log(`  - ${detail.title} (${detail.status})`)
  })
  
  // Import English/WordPress content
  console.log('\n=== Importing WordPress Content ===')
  const wordpressResult = await importWordPressContent({
    folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress',
    imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    dryRun: false,
    overwrite: true,
  })
  
  console.log(`\nWordPress Import Results:`)
  console.log(`- Success: ${wordpressResult.success}`)
  console.log(`- Imported: ${wordpressResult.imported}`)
  console.log(`- Failed: ${wordpressResult.failed}`)
  
  if (wordpressResult.failed > 0) {
    console.log('\nFailed imports:')
    wordpressResult.errors.forEach(err => {
      console.log(`  - ${err.file}: ${err.error}`)
    })
  }
  
  // Show sample of imported posts
  console.log('\nSample imported posts:')
  wordpressResult.details.slice(0, 5).forEach(detail => {
    console.log(`  - ${detail.title} (${detail.status})`)
  })
  
  // Final statistics
  console.log('\n=== Final Statistics ===')
  
  const finalCategories = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  
  const finalPosts = await payload.find({
    collection: 'posts',
    limit: 1000,
  })
  
  console.log(`Total categories created: ${finalCategories.totalDocs}`)
  console.log(`Total posts imported: ${finalPosts.totalDocs}`)
  
  // Show category hierarchy
  console.log('\n=== Category Hierarchy ===')
  
  const parentCats = finalCategories.docs.filter(c => !c.parent)
  const childCats = finalCategories.docs.filter(c => c.parent)
  
  console.log(`\nParent categories (${parentCats.length}):`)
  parentCats.forEach(cat => {
    console.log(`  - ${cat.title} (${cat.slug})`)
    
    // Show children
    const children = childCats.filter(child => {
      const parentId = typeof child.parent === 'string' ? child.parent : child.parent?.id
      return parentId === cat.id
    })
    
    if (children.length > 0) {
      children.forEach(child => {
        console.log(`    └─ ${child.title} (${child.slug})`)
      })
    }
  })
  
  // Check a sample post for categories
  console.log('\n=== Sample Post Categories ===')
  const samplePosts = await payload.find({
    collection: 'posts',
    limit: 3,
    depth: 2,
  })
  
  samplePosts.docs.forEach(post => {
    console.log(`\n${post.title}:`)
    if (post.categories && post.categories.length > 0) {
      post.categories.forEach((cat: any) => {
        if (typeof cat === 'object') {
          console.log(`  - ${cat.title} (${cat.slug})`)
        }
      })
    } else {
      console.log('  No categories assigned')
    }
  })
  
  console.log('\n=== Import Complete ===')
  process.exit(0)
}

importAll().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})