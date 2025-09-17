import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { convertMarkdownToLexical } from '../src/utilities/markdown-to-lexical'

async function importTerminologyPost() {
  console.log('=== Importing Golf Terminology Post ===\n')
  
  const payload = await getPayload({ config: configPromise })
  
  // Read the Golf Terminology file
  const filePath = '/Users/builequan/Desktop/web/rewriteapp_try7/export/wordpress/wordpress-golf-terminology-50-essential-terms-every-beginner-must-know.md'
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath)
    process.exit(1)
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Convert markdown to Lexical
  const converted = await convertMarkdownToLexical(content)
  const { metadata, lexicalContent, mermaidDiagrams } = converted
  
  console.log('Metadata:', metadata)
  console.log('Mermaid diagrams found:', mermaidDiagrams.length)
  console.log('Categories in file:', metadata.categories)
  
  // Process categories - create them first
  const categoryIds: string[] = []
  
  // Define parent-child mappings
  const categoryMappings: Record<string, string> = {
    'Golf Basics': 'Beginner Golf',
    'golf basics': 'Beginner Golf',
    'golf tips': 'Golf Instruction',
    'golf guide': 'Golf Instruction',
    'golf for beginners': 'Beginner Golf',
    'learning golf': 'Beginner Golf',
    'golf terms': 'Golf Instruction',
    'golf vocabulary': 'Golf Instruction',
  }
  
  // Ensure parent categories exist
  const parentCategories = ['Beginner Golf', 'Golf Instruction']
  const parentIds: Record<string, string> = {}
  
  for (const parentTitle of parentCategories) {
    let parent = await payload.find({
      collection: 'categories',
      where: { title: { equals: parentTitle } }
    })
    
    if (parent.docs.length === 0) {
      parent = await payload.create({
        collection: 'categories',
        data: {
          title: parentTitle,
          slug: parentTitle.toLowerCase().replace(/\s+/g, '-')
        }
      })
      parentIds[parentTitle] = parent.id
      console.log(`Created parent category: ${parentTitle}`)
    } else {
      parentIds[parentTitle] = parent.docs[0].id
    }
  }
  
  // Process each category from the file
  for (const cat of metadata.categories || []) {
    const parentTitle = categoryMappings[cat.toLowerCase()] || categoryMappings[cat]
    
    // Check if category exists
    let category = await payload.find({
      collection: 'categories',
      where: { title: { equals: cat } }
    })
    
    if (category.docs.length === 0) {
      // Create the category
      const categoryData: any = {
        title: cat,
        slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
      
      // Add parent if mapped
      if (parentTitle && parentIds[parentTitle]) {
        categoryData.parent = parentIds[parentTitle]
      }
      
      category = await payload.create({
        collection: 'categories',
        data: categoryData
      })
      
      categoryIds.push(category.id)
      console.log(`Created category: ${cat} ${parentTitle ? `(child of ${parentTitle})` : ''}`)
    } else {
      categoryIds.push(category.docs[0].id)
    }
    
    // Also add the parent category ID if it exists
    if (parentTitle && parentIds[parentTitle] && !categoryIds.includes(parentIds[parentTitle])) {
      categoryIds.push(parentIds[parentTitle])
    }
  }
  
  console.log('\nCategory IDs to assign:', categoryIds)
  
  // Add mermaid blocks to content
  if (mermaidDiagrams.length > 0) {
    console.log('\nAdding mermaid diagrams to content...')
    mermaidDiagrams.forEach((diagram, index) => {
      lexicalContent.root.children.push({
        type: 'block',
        fields: {
          blockType: 'mermaidDiagram',
          title: `Diagram ${index + 1}`,
          diagramCode: diagram,
          caption: '',
        },
        version: 1,
      })
    })
  }
  
  // Create or update the post
  const slug = 'golf-terminology-50-essential-terms-every-beginner-must-know'
  
  // Check if post exists
  let existingPost = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } }
  })
  
  const postData = {
    title: metadata.title || 'Golf Terminology: 50 Essential Terms Every Beginner Must Know',
    slug: slug,
    content: lexicalContent,
    excerpt: metadata.excerpt ? {
      root: {
        children: [{
          children: [{
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: metadata.excerpt,
            type: 'text',
            version: 1,
          }],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    } : null,
    categories: categoryIds,
    language: 'en',
    meta: {
      title: metadata.meta_title || metadata.title,
      description: metadata.meta_description || metadata.excerpt,
    },
    wordpressMetadata: {
      originalDate: metadata.date ? new Date(metadata.date) : new Date('2025-08-30'),
      modifiedDate: metadata.modified ? new Date(metadata.modified) : new Date('2025-08-30'),
      status: 'published',
      enableComments: true,
      enableToc: true,
    },
    publishedAt: new Date('2025-08-30'),
    _status: 'published',
  }
  
  let result
  if (existingPost.docs.length > 0) {
    // Update existing
    result = await payload.update({
      collection: 'posts',
      id: existingPost.docs[0].id,
      data: postData
    })
    console.log('\nUpdated existing post:', result.id)
  } else {
    // Create new
    result = await payload.create({
      collection: 'posts',
      data: postData
    })
    console.log('\nCreated new post:', result.id)
  }
  
  // Verify the post
  const verifyPost = await payload.findByID({
    collection: 'posts',
    id: result.id,
    depth: 2
  })
  
  console.log('\n=== Post Created/Updated ===')
  console.log('ID:', verifyPost.id)
  console.log('Title:', verifyPost.title)
  console.log('Slug:', verifyPost.slug)
  console.log('Categories:')
  if (verifyPost.categories && verifyPost.categories.length > 0) {
    verifyPost.categories.forEach((cat: any) => {
      if (typeof cat === 'object') {
        const parent = cat.parent ? ` (child of ${typeof cat.parent === 'object' ? cat.parent.title : 'parent'})` : ' (parent category)'
        console.log(`  - ${cat.title}${parent}`)
      }
    })
  }
  console.log('Content blocks:', verifyPost.content?.root?.children?.length || 0)
  
  const mermaidBlocks = verifyPost.content?.root?.children?.filter((c: any) => 
    c.type === 'block' && c.fields?.blockType === 'mermaidDiagram'
  ) || []
  console.log('Mermaid blocks:', mermaidBlocks.length)
  
  console.log('\n✅ Import complete!')
  console.log(`View post at: http://localhost:3000/admin/collections/posts/${result.id}`)
  
  process.exit(0)
}

importTerminologyPost().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})