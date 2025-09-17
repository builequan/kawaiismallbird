import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

interface LinkInfo {
  text: string
  url: string
  nodeIndex: number[]
  parentIndex: number
}

function findAndDeduplicateLinks(node: any, path: number[] = []): Map<string, LinkInfo[]> {
  const links = new Map<string, LinkInfo[]>()
  
  function traverse(n: any, currentPath: number[]) {
    if (!n) return
    
    // Check if this is a link node
    if (n.type === 'link' && n.fields?.url && n.children?.[0]?.text) {
      const text = n.children[0].text.trim().toLowerCase()
      const url = n.fields.url
      
      if (url.includes('a8.net') || url.includes('rakuten')) {
        const linkInfo: LinkInfo = {
          text: n.children[0].text,
          url,
          nodeIndex: [...currentPath],
          parentIndex: currentPath[currentPath.length - 2] || 0
        }
        
        if (!links.has(text)) {
          links.set(text, [])
        }
        links.get(text)!.push(linkInfo)
      }
    }
    
    // Traverse children
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach((child: any, index: number) => {
        traverse(child, [...currentPath, index])
      })
    }
  }
  
  traverse(node, path)
  return links
}

function removeNode(root: any, path: number[]): boolean {
  if (!path.length) return false
  
  let current = root
  const pathToParent = path.slice(0, -1)
  const indexToRemove = path[path.length - 1]
  
  // Navigate to parent
  for (const index of pathToParent) {
    if (!current.children || !current.children[index]) {
      return false
    }
    current = current.children[index]
  }
  
  // Remove the node and replace with its text content
  if (current.children && current.children[indexToRemove]) {
    const nodeToRemove = current.children[indexToRemove]
    
    // If it's a link node, replace with text node
    if (nodeToRemove.type === 'link' && nodeToRemove.children?.[0]?.text) {
      current.children[indexToRemove] = {
        text: nodeToRemove.children[0].text,
        type: 'text',
        version: 1
      }
    }
    return true
  }
  
  return false
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🔧 Fixing Duplicate Affiliate Links')
  console.log('==================================================\n')
  
  // Get all published posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0
  })
  
  console.log(`Found ${posts.docs.length} published posts\n`)
  
  let totalFixed = 0
  let postsProcessed = 0
  
  for (const post of posts.docs) {
    // Skip unpublished posts
    if ((post as any)._status !== 'published') continue
    if (!post.content?.root?.children) continue
    
    console.log(`\n📝 Processing: ${post.title}`)
    
    // Find all affiliate links grouped by text
    const linkGroups = findAndDeduplicateLinks(post.content.root)
    
    let duplicatesRemoved = 0
    const contentCopy = JSON.parse(JSON.stringify(post.content))
    
    // Process each group of links with same text
    for (const [, linkInfos] of linkGroups) {
      if (linkInfos.length > 1) {
        console.log(`   Found ${linkInfos.length} links for "${linkInfos[0].text}"`)
        
        // Keep only the first occurrence, remove others
        for (let i = linkInfos.length - 1; i > 0; i--) {
          const removed = removeNode(contentCopy.root, linkInfos[i].nodeIndex)
          if (removed) {
            duplicatesRemoved++
          }
        }
      }
    }
    
    if (duplicatesRemoved > 0) {
      // Update the post
      try {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            content: contentCopy
          }
        })
        
        console.log(`   ✅ Removed ${duplicatesRemoved} duplicate links`)
        totalFixed += duplicatesRemoved
        postsProcessed++
      } catch (error) {
        console.error(`   ❌ Failed to update post: ${error}`)
      }
    } else {
      console.log(`   ✓ No duplicates found`)
    }
  }
  
  console.log('\n==================================================')
  console.log(`✨ Deduplication Complete!`)
  console.log(`   Posts processed: ${postsProcessed}`)
  console.log(`   Total duplicate links removed: ${totalFixed}`)
  console.log(`   Average duplicates per post: ${postsProcessed > 0 ? (totalFixed / postsProcessed).toFixed(1) : '0'}`)
  console.log('==================================================\n')
  
  await payload.db.destroy()
}

main().catch(console.error)