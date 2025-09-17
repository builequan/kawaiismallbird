import { getPayload } from 'payload'
import configPromise from '../../src/payload.config'

// Define common golf keywords that should be linked
const golfKeywords = [
  'ゴルフクラブ',
  'ドライバー',
  'アイアン',
  'パター',
  'ゴルフボール',
  'ゴルフシューズ',
  'グローブ',
  'ゴルフウェア',
  'ゴルフバッグ',
  'レンジファインダー',
  'ティー',
  'マーカー',
  'スイング',
  'グリップ',
  '練習器具',
  'トレーニング',
  'レッスン',
  'ゴルフ場',
  'ラウンド',
  'スコア'
]

// Sample affiliate products with URLs
const affiliateProducts = [
  {
    keyword: 'ゴルフクラブ',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fgolfclub%252F'
  },
  {
    keyword: 'ドライバー',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fdriver%252F'
  },
  {
    keyword: 'ゴルフボール',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fgolfball%252F'
  },
  {
    keyword: 'パター',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fputter%252F'
  },
  {
    keyword: 'ゴルフシューズ',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Fgolfshoes%252F'
  },
  {
    keyword: 'アイアン',
    url: 'https://rpx.a8.net/svt/ejp?a8mat=45BP2Z+2BCPGY+2HOM+BWGDT&rakuten=y&a8ejpredirect=https%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2Fg00q0724.2bo11707.g00q0724.2bo12179%2Fa25080803315_45BP2Z_2BCPGY_2HOM_BWGDT%3Fpc%3Dhttps%253A%252F%252Fitem.rakuten.co.jp%252Firon%252F'
  }
]

function isHeading(node: any): boolean {
  return node.type === 'heading' && [1, 2, 3].includes(Number(node.tag))
}

function hasExistingLink(node: any): boolean {
  if (node.type === 'link' || node.type === 'autolink') return true
  if (node.children && Array.isArray(node.children)) {
    return node.children.some((child: any) => hasExistingLink(child))
  }
  return false
}

function addLinksToNode(node: any, usedKeywords: Set<string>, linkCount: { count: number }): any {
  const maxLinks = 6
  
  if (linkCount.count >= maxLinks) return node
  if (isHeading(node)) return node
  if (hasExistingLink(node)) return node
  
  // Process paragraph nodes
  if (node.type === 'paragraph' && node.children) {
    const newChildren: any[] = []
    
    for (const child of node.children) {
      if (linkCount.count >= maxLinks) {
        newChildren.push(child)
        continue
      }
      
      if (child.type === 'text' && child.text) {
        let text = child.text
        let processed = false
        
        // Check each keyword
        for (const product of affiliateProducts) {
          if (linkCount.count >= maxLinks) break
          if (usedKeywords.has(product.keyword)) continue
          
          const index = text.indexOf(product.keyword)
          if (index !== -1) {
            // Split text and add link
            const segments: any[] = []
            
            // Text before keyword
            if (index > 0) {
              segments.push({
                type: 'text',
                text: text.substring(0, index),
                format: child.format || 0
              })
            }
            
            // Affiliate link
            segments.push({
              type: 'link',
              fields: {
                url: product.url,
                newTab: true,
                linkType: 'custom',
                rel: 'sponsored nofollow noopener'
              },
              children: [
                {
                  type: 'text',
                  text: '🛒 ' + product.keyword,
                  format: 0
                }
              ],
              format: '',
              indent: 0,
              version: 2
            })
            
            // Text after keyword
            if (index + product.keyword.length < text.length) {
              segments.push({
                type: 'text',
                text: text.substring(index + product.keyword.length),
                format: child.format || 0
              })
            }
            
            newChildren.push(...segments)
            usedKeywords.add(product.keyword)
            linkCount.count++
            processed = true
            break
          }
        }
        
        if (!processed) {
          newChildren.push(child)
        }
      } else {
        newChildren.push(child)
      }
    }
    
    return { ...node, children: newChildren }
  }
  
  // Process children recursively
  if (node.children && Array.isArray(node.children)) {
    return {
      ...node,
      children: node.children.map((child: any) => addLinksToNode(child, usedKeywords, linkCount))
    }
  }
  
  return node
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  
  console.log('🛍️  Adding Golf Affiliate Links')
  console.log('==================================================')
  console.log(`📦 ${affiliateProducts.length} affiliate products configured`)
  console.log(`🔍 Keywords: ${affiliateProducts.map(p => p.keyword).join(', ')}`)
  
  // Get posts
  const posts = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0
  })
  
  console.log(`\n📄 Processing ${posts.docs.length} posts`)
  console.log('==================================================')
  
  let processedCount = 0
  let totalLinksAdded = 0
  
  for (const post of posts.docs) {
    if (!post.content?.root?.children) {
      console.log(`⏭️  No content: ${post.title}`)
      continue
    }
    
    // Skip if already has affiliate links
    const contentStr = JSON.stringify(post.content)
    if (contentStr.includes('🛒')) {
      console.log(`⏭️  Already has links: ${post.title}`)
      continue
    }
    
    // Add links
    const usedKeywords = new Set<string>()
    const linkCount = { count: 0 }
    
    const updatedRoot = addLinksToNode(post.content.root, usedKeywords, linkCount)
    
    if (linkCount.count > 0) {
      // Update post
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: {
            ...post.content,
            root: updatedRoot
          }
        }
      })
      
      console.log(`✅ Added ${linkCount.count} links to: ${post.title}`)
      console.log(`   Keywords: ${Array.from(usedKeywords).join(', ')}`)
      processedCount++
      totalLinksAdded += linkCount.count
    } else {
      console.log(`⏭️  No keywords found: ${post.title}`)
    }
  }
  
  console.log('')
  console.log('==================================================')
  console.log('📊 COMPLETE')
  console.log('==================================================')
  console.log(`✅ Processed: ${processedCount} posts`)
  console.log(`🔗 Total links added: ${totalLinksAdded}`)
  console.log(`📌 Average per post: ${processedCount > 0 ? (totalLinksAdded / processedCount).toFixed(1) : 0}`)
  console.log('')
  console.log('💡 Links are styled with:')
  console.log('   - Blue color (#2563eb)')
  console.log('   - Shopping cart icon (🛒)')
  console.log('   - Opens in new tab')
  console.log('   - Hover effects')
  
  await payload.db.destroy()
}

main().catch(console.error)