import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Recursively remove all link nodes from Lexical content
 */
function removeLinksFromLexical(node: any): any {
  if (!node) return node
  
  // If this is a link node, replace with its text content
  if (node.type === 'link' && node.children) {
    // Extract text from link children
    const textNodes = node.children.filter((child: any) => child.type === 'text')
    if (textNodes.length > 0) {
      // Return just the text nodes without the link wrapper
      return textNodes
    }
    return null
  }
  
  // Process children recursively
  if (node.children && Array.isArray(node.children)) {
    const newChildren = []
    for (const child of node.children) {
      const processed = removeLinksFromLexical(child)
      if (processed) {
        if (Array.isArray(processed)) {
          newChildren.push(...processed)
        } else {
          newChildren.push(processed)
        }
      }
    }
    return { ...node, children: newChildren }
  }
  
  return node
}

/**
 * Remove product showcase section if it exists
 */
function removeShowcaseSection(content: any): any {
  if (!content?.root?.children) return content
  
  // Filter out showcase section (heading with "おすすめ商品" and following paragraphs)
  const filteredChildren = []
  let skipNext = 0
  
  for (let i = 0; i < content.root.children.length; i++) {
    const node = content.root.children[i]
    
    if (skipNext > 0) {
      skipNext--
      continue
    }
    
    // Check if this is a showcase heading
    if (node.type === 'heading' && node.children) {
      const text = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.text || '')
        .join('')
      
      if (text.includes('おすすめ商品') || text.includes('関連商品')) {
        // Skip this heading and next 6-8 paragraphs (product listings)
        skipNext = 8
        continue
      }
    }
    
    filteredChildren.push(node)
  }
  
  return {
    ...content,
    root: {
      ...content.root,
      children: filteredChildren
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🗑️ Starting to remove all affiliate links...')
    
    // Get all published posts
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: {
          equals: 'published'
        }
      },
      limit: 1000,
    })
    
    console.log(`Found ${posts.docs.length} posts to process`)
    
    let processed = 0
    let linksRemoved = 0
    let errors = 0
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root) {
          continue
        }
        
        // Count existing links before removal
        const countLinks = (node: any): number => {
          let count = 0
          if (node.type === 'link') count = 1
          if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              count += countLinks(child)
            }
          }
          return count
        }
        
        const linksBefore = countLinks(post.content.root)
        
        if (linksBefore === 0) {
          continue // Skip posts with no links
        }
        
        // Remove links from content
        let cleanContent = JSON.parse(JSON.stringify(post.content))
        cleanContent.root = removeLinksFromLexical(cleanContent.root)
        
        // Remove showcase section
        cleanContent = removeShowcaseSection(cleanContent)
        
        // Update the post
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: cleanContent
          }
        })
        
        processed++
        linksRemoved += linksBefore
        console.log(`✅ Removed ${linksBefore} links from: ${post.title}`)
        
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error)
        errors++
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      linksRemoved,
      errors,
      message: `Successfully removed ${linksRemoved} links from ${processed} posts`
    })
    
  } catch (error: any) {
    console.error('Remove all links error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to remove links',
        details: error.message,
      },
      { status: 500 }
    )
  }
}