import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { convertMarkdownToLexical } from '../src/utilities/markdown-to-lexical'
import fs from 'fs'
import path from 'path'

async function testSpecificImport() {
  const payload = await getPayload({ config: configPromise })

  console.log('=== Testing Table Import from Golf Bag Organization Post ===\n')

  // Read the markdown file with tables
  const markdownPath = '/Users/builequan/Desktop/web/rewriteapp_try7/export/japanese/golf-bag-organization-pros-secret-ja.md'
  const markdownContent = fs.readFileSync(markdownPath, 'utf-8')
  
  // Check for tables in markdown
  const tableLines = markdownContent.split('\n').filter(line => line.includes('|'))
  console.log(`Table lines found in markdown: ${tableLines.length}`)
  
  if (tableLines.length > 0) {
    console.log('\nFirst few table lines:')
    tableLines.slice(0, 5).forEach(line => console.log(`  ${line.substring(0, 80)}...`))
  }

  try {
    console.log('\nConverting markdown to Lexical...')
    const { metadata, lexicalContent } = await convertMarkdownToLexical(markdownContent)
    
    console.log('\nMetadata:', {
      title: metadata.title,
      slug: metadata.slug,
      categories: metadata.categories,
    })
    
    // Check for table nodes in Lexical content
    const contentNodes = lexicalContent.root?.children || []
    console.log(`\nTotal Lexical nodes: ${contentNodes.length}`)
    
    // Count node types
    const nodeTypes: Record<string, number> = {}
    contentNodes.forEach((node: any) => {
      const type = node.type === 'block' ? 'block:' + node.fields?.blockType : node.type
      nodeTypes[type] = (nodeTypes[type] || 0) + 1
    })
    
    console.log('\nNode types found:')
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`)
    })
    
    // Find and inspect table nodes
    const tableNodes = contentNodes.filter((node: any) => node.type === 'table')
    console.log(`\nTable nodes in Lexical: ${tableNodes.length}`)
    
    if (tableNodes.length > 0) {
      console.log('\n=== Table Structure ===')
      tableNodes.forEach((table: any, index: number) => {
        console.log(`\nTable ${index + 1}:`)
        console.log(`  Rows: ${table.children?.length || 0}`)
        
        if (table.children?.[0]) {
          console.log(`  Columns: ${table.children[0].children?.length || 0}`)
          
          // Show header row content
          const firstRow = table.children[0]
          console.log('  Header row cells:')
          firstRow.children?.forEach((cell: any, cellIndex: number) => {
            const text = cell.children?.[0]?.children?.[0]?.text || ''
            const isHeader = cell.headerState === 3
            console.log(`    Cell ${cellIndex + 1}${isHeader ? ' (header)' : ''}: "${text.substring(0, 30)}..."`)
          })
        }
      })
    } else {
      console.log('\n❌ No tables found in Lexical content!')
      console.log('This might indicate an issue with the markdown-to-lexical converter.')
    }
    
    // Now create/update the post
    console.log('\n=== Creating/Updating Post ===')
    
    const slug = metadata.slug || 'golf-bag-organization-test'
    
    // Check if post exists
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } }
    })
    
    let result
    if (existing.docs.length > 0) {
      // Update existing post
      result = await payload.update({
        collection: 'posts',
        id: existing.docs[0].id,
        data: {
          title: metadata.title || 'Golf Bag Organization Test',
          content: lexicalContent,
          _status: 'published',
        },
      })
      console.log(`✅ Post updated with ID: ${result.id}`)
    } else {
      // Create new post
      result = await payload.create({
        collection: 'posts',
        data: {
          title: metadata.title || 'Golf Bag Organization Test',
          slug: slug,
          content: lexicalContent,
          categories: [],
          language: 'ja',
          publishedAt: new Date().toISOString(),
          _status: 'published',
        },
      })
      console.log(`✅ Post created with ID: ${result.id}`)
    }
    
    console.log(`View at: http://localhost:3000/posts/${slug}`)
    console.log(`Admin: http://localhost:3000/admin/collections/posts/${result.id}`)
    
    // Verify the saved content
    const verifyPost = await payload.findByID({
      collection: 'posts',
      id: result.id,
    })
    
    const savedNodes = verifyPost.content?.root?.children || []
    const savedTables = savedNodes.filter((node: any) => node.type === 'table')
    
    console.log(`\n=== Final Verification ===`)
    console.log(`Tables saved in database: ${savedTables.length}`)
    
    if (savedTables.length > 0) {
      console.log('✅ Tables were successfully saved and are ready for display!')
    } else {
      console.log('❌ Tables were not saved properly - needs debugging')
    }
    
  } catch (error) {
    console.error('Error during import:', error)
  }
  
  process.exit(0)
}

testSpecificImport().catch(console.error)