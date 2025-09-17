import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function inspectBlocks() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('Inspecting existing posts for block structure...')
  
  // Get posts that have content
  const posts = await payload.find({
    collection: 'posts',
    limit: 10,
    where: {
      content: { exists: true }
    }
  })
  
  console.log(`Found ${posts.docs.length} posts with content`)
  
  for (const post of posts.docs) {
    console.log(`\n=== Post: ${post.title} ===`)
    
    if (post.content && post.content.root && post.content.root.children) {
      const blocks = post.content.root.children.filter((child: any) => child.type === 'block')
      
      if (blocks.length > 0) {
        console.log(`Found ${blocks.length} blocks:`)
        blocks.forEach((block: any, index: number) => {
          console.log(`  Block ${index + 1}:`)
          console.log(`    Type: ${block.type}`)
          console.log(`    Block Name: ${block.blockName || 'undefined'}`)
          console.log(`    Block Type: ${block.blockType || 'undefined'}`)
          console.log(`    Fields:`, Object.keys(block.fields || {}))
          
          if (block.blockName === 'mermaidDiagram' || block.blockType === 'mermaidDiagram') {
            console.log(`    Mermaid fields:`, block.fields)
          }
        })
      } else {
        console.log('  No blocks found in this post')
      }
    } else {
      console.log('  No content structure found')
    }
  }
  
  process.exit(0)
}

inspectBlocks().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})