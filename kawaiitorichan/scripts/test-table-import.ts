import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { convertMarkdownToLexical } from '../src/utilities/markdown-to-lexical'

async function testTableImport() {
  const payload = await getPayload({ config: configPromise })

  console.log('=== Testing Table Import from Markdown ===\n')

  // Test markdown content with a table
  const markdownContent = `---
title: Test Post with Table
slug: test-table-post
categories:
  - Test
---

# Test Post with Table

This is a test post to verify table rendering.

## Sample Table

| チャレンジ状況 | 可能性のある原因 | 即座の対応 | 予防戦略 |
|---|---|---|---|
| ボールロスト | 悪いショット方向 | ペナルティドロップ | プロビジョナルボールプレー |
| 後ろでスロープレー | 天熱練 | 速いグループを先に行かせる | レディゴルフ維持 |
| 服装/戦略調整 | 予報チェック、器具持参 | 困難なライ | ラフ/バザード内のボール |
| 選択肢を注意深く評価 | コース戦略 | 機器故障 | 壊れたクラブ/カート問題 |

## Another Table

| Column A | Column B | Column C |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

Regular paragraph after the table.
`

  try {
    console.log('Converting markdown to Lexical...')
    const { metadata, lexicalContent } = await convertMarkdownToLexical(markdownContent)
    
    console.log('Metadata:', metadata)
    console.log('\n=== Lexical Content Structure ===')
    
    // Check for table nodes
    const contentNodes = lexicalContent.root?.children || []
    console.log(`Total nodes: ${contentNodes.length}`)
    
    // Count node types
    const nodeTypes: Record<string, number> = {}
    contentNodes.forEach((node: any) => {
      const type = node.type === 'block' ? `block:${node.fields?.blockType}` : node.type
      nodeTypes[type] = (nodeTypes[type] || 0) + 1
    })
    
    console.log('\nNode types found:')
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`)
    })
    
    // Find and inspect table nodes
    const tableNodes = contentNodes.filter((node: any) => node.type === 'table')
    console.log(`\nTable nodes found: ${tableNodes.length}`)
    
    if (tableNodes.length > 0) {
      console.log('\n=== Table Structure ===')
      tableNodes.forEach((table: any, index: number) => {
        console.log(`\nTable ${index + 1}:`)
        console.log(`  Rows: ${table.children?.length || 0}`)
        
        if (table.children?.[0]) {
          console.log(`  Columns: ${table.children[0].children?.length || 0}`)
          
          // Show first row content
          const firstRow = table.children[0]
          console.log('  First row cells:')
          firstRow.children?.forEach((cell: any, cellIndex: number) => {
            const text = cell.children?.[0]?.children?.[0]?.text || ''
            const isHeader = cell.headerState === 3
            console.log(`    Cell ${cellIndex + 1}${isHeader ? ' (header)' : ''}: "${text}"`)
          })
        }
      })
    }
    
    // Now create a test post with this content
    console.log('\n=== Creating Test Post ===')
    
    const slug = 'test-table-import-' + Date.now()
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Test Table Import',
        slug: slug,
        content: lexicalContent,
        categories: [],
        language: 'en',
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
    })
    
    console.log(`✅ Post created with ID: ${post.id}`)
    console.log(`View at: http://localhost:3000/admin/collections/posts/${post.id}`)
    
    // Verify the saved content
    const verifyPost = await payload.findByID({
      collection: 'posts',
      id: post.id,
    })
    
    const savedNodes = verifyPost.content?.root?.children || []
    const savedTables = savedNodes.filter((node: any) => node.type === 'table')
    
    console.log(`\n=== Verification ===`)
    console.log(`Saved table nodes: ${savedTables.length}`)
    
    if (savedTables.length > 0) {
      console.log('✅ Tables were successfully saved!')
    } else {
      console.log('❌ Tables were not saved properly')
    }
    
  } catch (error) {
    console.error('Error during test:', error)
  }
  
  process.exit(0)
}

testTableImport().catch(console.error)