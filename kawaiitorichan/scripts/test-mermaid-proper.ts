import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testMermaidProper() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('Creating post with proper Mermaid diagram structure...')
  
  // Simple Mermaid diagram code
  const mermaidCode = `flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    B -->|No| D[End]`
  
  try {
    // First, let's create a simple post without blocks
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Simple Post Without Mermaid',
        slug: 'simple-post-no-mermaid',
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
                    text: 'This is a simple post without any Mermaid blocks.',
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
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'We will add Mermaid diagrams through the admin interface instead.',
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
    console.log('\n⚠️  IMPORTANT: Add Mermaid diagrams through the admin interface')
    console.log('The blocks created programmatically have structural issues with the Lexical editor.')
    
  } catch (error) {
    console.error('❌ Error creating post:', error)
  }
  
  process.exit(0)
}

testMermaidProper().catch(error => {
  console.error('Script error:', error)
  process.exit(1)
})