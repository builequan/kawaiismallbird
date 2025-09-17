import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function fixMermaidBlocks() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('Fixing posts with Mermaid blocks...')
  
  // Find all posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 100,
  })
  
  console.log(`Found ${posts.docs.length} posts`)
  
  for (const post of posts.docs) {
    if (post.content?.root?.children) {
      const hasMermaidBlocks = post.content.root.children.some((child: any) => 
        child.type === 'block' && child.fields?.blockType === 'mermaidDiagram'
      )
      
      if (hasMermaidBlocks) {
        console.log(`\nFixing post: ${post.title} (${post.id})`)
        
        // Extract mermaid blocks
        const mermaidBlocks: any[] = []
        const newChildren = post.content.root.children.filter((child: any) => {
          if (child.type === 'block' && child.fields?.blockType === 'mermaidDiagram') {
            mermaidBlocks.push(child)
            return false // Remove from content
          }
          return true
        })
        
        // Add information about mermaid blocks as text
        if (mermaidBlocks.length > 0) {
          console.log(`  - Found ${mermaidBlocks.length} Mermaid blocks`)
          
          // Add a note about the mermaid diagrams
          newChildren.push({
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: `[Note: This post contained ${mermaidBlocks.length} Mermaid diagram(s) that need to be re-added through the admin interface]`,
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          })
          
          // Add the diagram codes as code blocks for preservation
          mermaidBlocks.forEach((block, index) => {
            newChildren.push({
              children: [
                {
                  detail: 0,
                  format: 1, // Bold
                  mode: 'normal',
                  style: '',
                  text: `Mermaid Diagram ${index + 1}: ${block.fields.title || 'Untitled'}`,
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            })
            
            newChildren.push({
              children: [
                {
                  detail: 0,
                  format: 16, // Code format
                  mode: 'normal',
                  style: '',
                  text: block.fields.diagramCode,
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            })
          })
        }
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: {
              ...post.content,
              root: {
                ...post.content.root,
                children: newChildren,
              },
            },
          },
        })
        
        console.log(`  ✅ Fixed post ${post.id}`)
      }
    }
  }
  
  console.log('\n✅ All posts have been fixed!')
  console.log('Mermaid diagrams have been preserved as text and can be re-added through the admin interface.')
  
  process.exit(0)
}

fixMermaidBlocks().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})