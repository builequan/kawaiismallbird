import { importWordPressContent } from '../src/utilities/wordpress-import'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function reimportAllPosts() {
  console.log('Starting full reimport with fixed image handling...')
  
  const payload = await getPayload({ config: configPromise })
  
  // Clear all existing posts
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
      // Ignore revalidation errors
    }
  }
  console.log(`Deleted ${existingPosts.docs.length} posts`)
  
  // Clear all categories to ensure clean import
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
  
  // Import from the Japanese content folder
  console.log('\n=== Starting Import ===')
  const result = await importWordPressContent({
    folderPath: '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese',
    imagesFolder: '/Users/builequan/Desktop/web/rewriteapp_try7/export/images',
    dryRun: false,
    overwrite: true,
  })
  
  console.log('\n=== Import Results ===')
  console.log(`Success: ${result.success}`)
  console.log(`Imported: ${result.imported}`)
  console.log(`Failed: ${result.failed}`)
  
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
  console.log(`\nTotal categories created: ${categories.docs.length}`)
  
  // Check posts with images
  const posts = await payload.find({
    collection: 'posts',
    limit: 5,
  })
  
  console.log('\n=== Checking Image Processing ===')
  let postsWithImages = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root) continue
    
    let hasImages = false
    
    const checkNode = (node: any): void => {
      if (!node) return
      
      if (node.type === 'upload' && node.value?.id) {
        hasImages = true
      }
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(checkNode)
      }
    }
    
    checkNode(post.content.root)
    
    if (hasImages) {
      postsWithImages++
      console.log(`✓ ${post.title} has images`)
    }
  }
  
  console.log(`\n${postsWithImages} out of ${posts.docs.length} checked posts have properly processed images`)
}

reimportAllPosts()
  .then(() => {
    console.log('\nFull reimport complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })