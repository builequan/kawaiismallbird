import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function debugPostContent() {
  const payload = await getPayload({ config: configPromise })
  
  // Get first post with duplicate H1
  const posts = await payload.find({
    collection: 'posts',
    limit: 1,
    where: {
      slug: {
        equals: 'your-first-golf-lesson-what-to-expect-and-how-to-prepare-japanese'
      }
    }
  })
  
  if (posts.docs.length > 0) {
    const post = posts.docs[0]
    console.log('Post Title:', post.title)
    console.log('\nContent structure:')
    console.log('Total children:', post.content?.root?.children?.length)
    console.log('\nFirst 5 nodes:')
    
    post.content?.root?.children?.slice(0, 5).forEach((node, i) => {
      console.log(`\nNode ${i + 1}:`)
      console.log('Type:', node.type)
      if (node.type === 'heading') {
        console.log('Tag:', node.tag)
        console.log('Text:', node.children?.[0]?.text)
      } else if (node.type === 'paragraph') {
        const text = node.children?.[0]?.text || ''
        console.log('Text (first 100 chars):', text.substring(0, 100))
      }
    })
    
    // Try removing first H1
    if (post.content?.root?.children?.[0]?.type === 'heading' && 
        post.content?.root?.children?.[0]?.tag === 'h1') {
      
      const newChildren = post.content.root.children.slice(1)
      console.log('\nAfter removing H1:')
      console.log('Remaining children:', newChildren.length)
      
      if (newChildren.length > 0) {
        console.log('First node after H1:')
        console.log('Type:', newChildren[0].type)
        if (newChildren[0].type === 'paragraph') {
          const text = newChildren[0].children?.[0]?.text || ''
          console.log('Text (first 100 chars):', text.substring(0, 100))
        }
      }
    }
  }
  
  process.exit(0)
}

debugPostContent().catch(console.error)