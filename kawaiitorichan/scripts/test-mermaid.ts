import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testMermaid() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('Creating post with Mermaid diagram...')
  
  // Simple Mermaid diagram code
  const mermaidCode = `flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]`
  
  try {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Mermaid Test Post',
        slug: 'mermaid-test-post',
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This post contains a Mermaid diagram:',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                type: 'block',
                fields: {
                  blockType: 'mermaidDiagram',
                  title: 'Test Diagram',
                  diagramCode: mermaidCode,
                  caption: 'A simple test flowchart',
                  id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                },
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'The diagram should appear above this text.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        _status: 'published',
        language: 'en',
      }
    })
    
    console.log('✅ Post created successfully:', post.id)
    console.log(`Admin URL: http://localhost:3000/admin/collections/posts/${post.id}`)
    console.log(`Frontend URL: http://localhost:3000/posts/${post.slug}`)
    
    // Verify the content structure
    const verifyPost = await payload.findByID({
      collection: 'posts',
      id: post.id,
    })
    
    console.log('\n=== Content Verification ===')
    console.log('Total content blocks:', verifyPost.content?.root?.children?.length || 0)
    
    const mermaidBlocks = verifyPost.content?.root?.children?.filter((c: any) => 
      c.type === 'block' && c.fields?.blockType === 'mermaidDiagram'
    ) || []
    
    console.log('Mermaid blocks found:', mermaidBlocks.length)
    
    if (mermaidBlocks.length > 0) {
      const block = mermaidBlocks[0]
      console.log('Mermaid block structure:')
      console.log('  - Title:', block.fields?.title)
      console.log('  - Caption:', block.fields?.caption)
      console.log('  - Code preview:', block.fields?.diagramCode?.substring(0, 50) + '...')
    }
    
  } catch (error) {
    console.error('❌ Error creating post:', error)
    
    if (error.data && error.data.errors) {
      console.log('\nValidation errors:')
      error.data.errors.forEach((err: any) => {
        console.log('  -', err.message)
      })
    }
  }
  
  process.exit(0)
}

testMermaid().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})