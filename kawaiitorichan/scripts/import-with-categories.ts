import { getPayload } from 'payload'
import config from '@payload-config'
import { createCategoryMapper } from './utils/category-mapper'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

async function importWithCategories() {
  const payload = await getPayload({ config })
  const mapper = await createCategoryMapper(payload)

  console.log('Starting import with automatic category assignment...')

  // Example: Import a sample post and assign categories
  const samplePost = {
    title: 'Best Golf Clubs for Beginners 2024: Complete Buying Guide',
    content: `
      If you're new to golf and looking for the best clubs to start your journey, 
      this comprehensive guide will help you choose the perfect set. We'll cover 
      drivers, irons, wedges, and putters that are ideal for beginners. 
      Learn about club fitting, shaft selection, and equipment maintenance.
    `,
    slug: 'best-golf-clubs-beginners-2024',
    meta: {
      description: 'Discover the best golf clubs for beginners in 2024. Complete buying guide with reviews and recommendations.',
    },
  }

  // Get category suggestions based on content
  const suggestedCategoryIds = await mapper.suggestCategories(
    samplePost.title,
    samplePost.content
  )

  console.log('\nSample Post:', samplePost.title)
  console.log('Suggested Categories:')
  
  for (const categoryId of suggestedCategoryIds) {
    const { docs } = await payload.find({
      collection: 'categories',
      where: { id: { equals: categoryId } },
      limit: 1,
    })
    if (docs[0]) {
      console.log(`  - ${docs[0].title} (${docs[0].slug})`)
    }
  }

  // Create the post with categories
  try {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: samplePost.title,
        slug: samplePost.slug,
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: samplePost.content.trim(),
                  },
                ],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        categories: suggestedCategoryIds,
        meta: samplePost.meta,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
    })

    console.log(`\n✅ Created post: ${post.title}`)
    console.log(`   URL: /posts/${post.slug}`)
    console.log(`   Categories: ${suggestedCategoryIds.length} assigned`)
  } catch (error: any) {
    if (error.data?.errors?.[0]?.message?.includes('unique')) {
      console.log('\n⚠️  Post already exists, skipping...')
    } else {
      console.error('\n❌ Error creating post:', error.message)
    }
  }

  console.log('\n--- WordPress Category Mapping Examples ---')
  
  // Example WordPress categories from your data
  const wpCategories = [
    'Golf Fundamentals & Getting Started',
    'Equipment & Gear',
    'Swing Technique & Instruction',
    'Course Management & Strategy',
    'Rules, Etiquette & Culture',
  ]

  for (const wpCat of wpCategories) {
    const mappedIds = mapper.mapWordPressCategory(wpCat)
    console.log(`\n"${wpCat}" maps to:`)
    
    for (const categoryId of mappedIds) {
      const { docs } = await payload.find({
        collection: 'categories',
        where: { id: { equals: categoryId } },
        limit: 1,
      })
      if (docs[0]) {
        console.log(`  - ${docs[0].title}`)
      }
    }
  }

  console.log('\n✅ Import with categories demonstration completed!')
  process.exit(0)
}

importWithCategories().catch((error) => {
  console.error('Import error:', error)
  process.exit(1)
})