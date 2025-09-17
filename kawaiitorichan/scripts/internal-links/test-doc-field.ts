#!/usr/bin/env tsx
/**
 * Test different doc field structures
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testDocField() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get two posts
    const { docs } = await payload.find({
      collection: 'posts',
      limit: 2,
      where: { 
        _status: { equals: 'published' }
      }
    })
    
    if (docs.length < 2) {
      console.log('Need at least 2 posts')
      process.exit(1)
    }
    
    const postToUpdate = docs[0]
    const postToLinkTo = docs[1]
    
    console.log('Post to update:', postToUpdate.title)
    console.log('Post to link to:', postToLinkTo.title)
    console.log('Target ID:', postToLinkTo.id)
    
    // Try different doc field structures
    const structures = [
      { name: 'Just ID', value: postToLinkTo.id },
      { name: 'String ID', value: String(postToLinkTo.id) },
      { name: 'Object with value', value: { value: postToLinkTo.id, relationTo: 'posts' } },
      { name: 'Object with id', value: { id: postToLinkTo.id, relationTo: 'posts' } },
    ]
    
    for (const structure of structures) {
      console.log(`\nTrying: ${structure.name}`)
      console.log('Value:', structure.value)
      
      const newContent = {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'link',
                  children: [
                    {
                      type: 'text',
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'test link',
                      version: 1,
                    }
                  ],
                  direction: null,
                  format: '',
                  indent: 0,
                  version: 2,
                  fields: {
                    linkType: 'internal',
                    doc: structure.value,
                    newTab: false,
                    url: null
                  }
                }
              ]
            }
          ],
          direction: 'ltr',
        }
      }
      
      try {
        await payload.update({
          collection: 'posts',
          id: postToUpdate.id,
          data: {
            content: newContent,
          },
        })
        
        console.log('✓ SUCCESS with:', structure.name)
        break
        
      } catch (error: any) {
        console.log('✗ Failed:', error.message?.split('\n')[0])
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

testDocField()