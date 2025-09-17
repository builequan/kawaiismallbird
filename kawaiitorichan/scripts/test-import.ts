import { importWordPressContent } from '../src/utilities/wordpress-import'

async function testImport() {
  console.log('Starting test import with Japanese content...')
  
  const result = await importWordPressContent({
    folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
    imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    dryRun: true,
    overwrite: false,
  })
  
  console.log('\n=== Import Results ===')
  console.log(`Success: ${result.success}`)
  console.log(`Imported: ${result.imported}`)
  console.log(`Failed: ${result.failed}`)
  
  if (result.details.length > 0) {
    console.log('\n=== Import Details ===')
    result.details.slice(0, 5).forEach(detail => {
      console.log(`- ${detail.file}: ${detail.status} (${detail.title})`)
    })
    
    if (result.details.length > 5) {
      console.log(`... and ${result.details.length - 5} more`)
    }
  }
  
  if (result.errors.length > 0) {
    console.log('\n=== Errors ===')
    result.errors.forEach(error => {
      console.log(`- ${error.file}: ${error.error}`)
    })
  }
  
  // Check categories created
  const { getPayload } = await import('payload')
  const configPromise = await import('@payload-config')
  const payload = await getPayload({ config: configPromise.default })
  
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  
  console.log('\n=== Categories in Database ===')
  console.log(`Total categories: ${categories.totalDocs}`)
  
  // Show parent categories
  const parentCategories = categories.docs.filter(cat => !cat.parent)
  console.log(`\nParent categories (${parentCategories.length}):`)
  parentCategories.forEach(cat => {
    console.log(`- ${cat.title} (slug: ${cat.slug})`)
  })
  
  // Show child categories with their parents
  const childCategories = categories.docs.filter(cat => cat.parent)
  if (childCategories.length > 0) {
    console.log(`\nChild categories (${childCategories.length}):`)
    for (const cat of childCategories.slice(0, 10)) {
      let parentTitle = 'Unknown'
      if (typeof cat.parent === 'string') {
        const parent = categories.docs.find(p => p.id === cat.parent)
        if (parent) parentTitle = parent.title
      } else if (cat.parent && typeof cat.parent === 'object') {
        parentTitle = cat.parent.title
      }
      console.log(`- ${cat.title} (slug: ${cat.slug}) -> Parent: ${parentTitle}`)
    }
    
    if (childCategories.length > 10) {
      console.log(`... and ${childCategories.length - 10} more`)
    }
  }
  
  process.exit(0)
}

testImport().catch(error => {
  console.error('Error during import:', error)
  process.exit(1)
})