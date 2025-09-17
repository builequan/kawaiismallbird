#!/usr/bin/env tsx

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  const posts = await payload.find({
    collection: 'posts',
    limit: 5,
    where: { _status: { equals: 'published' } }
  })
  
  for (const post of posts.docs) {
    console.log('\n' + '='.repeat(50))
    console.log('Post:', post.title)
    console.log('Fields present:')
    console.log('  - content:', post.content ? 'yes' : 'no')
    console.log('  - content_backup:', post.content_backup ? 'yes' : 'no')
    console.log('  - content_html:', post.content_html ? (post.content_html.length + ' chars') : 'no')
    
    if (post.content) {
      console.log('\nContent type:', typeof post.content)
      if (post.content.root) {
        console.log('Has root node')
        console.log('Root children:', post.content.root.children?.length || 0)
      }
    }
  }
  
  process.exit(0)
}

main().catch(console.error)