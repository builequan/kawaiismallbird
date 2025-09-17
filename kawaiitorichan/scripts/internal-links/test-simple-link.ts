#!/usr/bin/env tsx
/**
 * Test creating a simple internal link
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function testSimpleLink() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    // Get two posts - one to update, one to link to
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
    console.log('Link target ID:', postToLinkTo.id, 'Type:', typeof postToLinkTo.id)
    
    // Create a simple content with a link
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
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'This is a test paragraph with a ',
                version: 1,
              },
              {
                type: 'link',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'link to another post',
                    version: 1,
                  }
                ],
                direction: null,
                format: '',
                indent: 0,
                version: 2,
                fields: {
                  linkType: 'internal',
                  doc: postToLinkTo.id,
                  newTab: false,
                  url: null
                }
              },
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: ' in it.',
                version: 1,
              }
            ]
          }
        ],
        direction: 'ltr',
      }
    }
    
    console.log('\nAttempting to update with link...')
    console.log('Link structure:', JSON.stringify(newContent.root.children[0].children[1], null, 2))
    
    const updated = await payload.update({
      collection: 'posts',
      id: postToUpdate.id,
      data: {
        content: newContent,
      },
    })
    
    console.log('✓ Update successful!')
    
    // Verify the link was saved
    const { docs: [verifyPost] } = await payload.find({
      collection: 'posts',
      where: { id: { equals: postToUpdate.id } },
      depth: 2
    })
    
    console.log('\nVerifying saved content...')
    const savedLink = verifyPost.content?.root?.children?.[0]?.children?.[1]
    if (savedLink?.type === 'link') {
      console.log('✓ Link saved correctly')
      console.log('Link fields:', savedLink.fields)
    }
    
  } catch (error: any) {
    console.error('Error:', error.message)
    if (error.data?.errors) {
      console.error('Validation errors:', JSON.stringify(error.data.errors, null, 2))
    }
    process.exit(1)
  }
  
  process.exit(0)
}

testSimpleLink()