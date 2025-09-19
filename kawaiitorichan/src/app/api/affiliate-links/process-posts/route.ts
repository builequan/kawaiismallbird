import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import * as fs from 'fs/promises'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'affiliate-links')

interface Product {
  id: number
  product_name: string
  anchorPhrases: string[]
  affiliate_url: string
  clean_url: string
  price: string
  status: string
}

async function loadProducts(): Promise<Product[]> {
  const productsPath = path.join(DATA_DIR, 'products-index.json')
  try {
    const products = JSON.parse(await fs.readFile(productsPath, 'utf-8'))
    return products.filter((p: Product) => p.status === 'active')
  } catch (error) {
    console.error('Error loading products:', error)
    return []
  }
}

function isHeading(node: any): boolean {
  return node.type === 'heading' && [1, 2, 3].includes(Number(node.tag))
}

function hasExistingLink(node: any): boolean {
  if (node.type === 'link' || node.type === 'autolink') return true
  return false
}

// Count paragraphs in content
function countParagraphs(node: any): number {
  let count = 0
  
  function traverse(n: any) {
    if (n.type === 'paragraph') count++
    if (n.children && Array.isArray(n.children)) {
      n.children.forEach(traverse)
    }
  }
  
  traverse(node)
  return count
}

// Comprehensive dictionary of Japanese compound words
const COMPOUND_WORDS: { [key: string]: string[] } = {
  'スコア': ['スコアカード', 'スコアリング', 'スコアボード', 'スコアメイク'],
  'プレー': ['プレーヤー', 'プレースタイル', 'プレーオフ'],
  'ゴルフ': ['ゴルファー', 'ゴルフ場', 'ゴルフクラブ', 'ゴルフボール', 'ゴルフバッグ'],
  'パット': ['パッティング', 'パッター', 'パットライン'],
  'クラブ': ['クラブハウス', 'クラブフェース', 'クラブヘッド'],
  'ドライバー': ['ドライバーショット'],
  'ボール': ['ボールマーカー', 'ボールポジション'],
  'アイアン': ['アイアンショット', 'アイアンセット'],
  'グリーン': ['グリーンキーパー', 'グリーンフィー', 'グリーンサイド'],
  'フェアウェイ': ['フェアウェイウッド', 'フェアウェイバンカー'],
  'スイング': ['スイングプレーン', 'スイングスピード', 'スイングアーク'],
  'バック': ['バックスイング', 'バックスピン'],
  'ラウンド': ['ラウンドレッスン'],
  'ハンディ': ['ハンディキャップ'],
}

// Check if a keyword at a position is part of a compound word
function isPartOfCompoundWord(text: string, keyword: string, position: number): boolean {
  const compounds = COMPOUND_WORDS[keyword] || []

  for (const compound of compounds) {
    const keywordIndexInCompound = compound.indexOf(keyword)
    if (keywordIndexInCompound === -1) continue

    const compoundStartInText = position - keywordIndexInCompound

    if (compoundStartInText >= 0 && compoundStartInText + compound.length <= text.length) {
      const potentialCompound = text.substring(compoundStartInText, compoundStartInText + compound.length)
      if (potentialCompound === compound) {
        return true
      }
    }
  }

  return false
}

// Process single paragraph with link limits
function processParagraph(
  paragraph: any,
  products: Product[],
  globalUsedKeywords: Set<string>,
  paragraphLinkLimit: number = 1, // Max 1 link per paragraph to avoid cluttering
  globalLinkCount: { count: number },
  globalMaxLinks: number
): any {
  if (globalLinkCount.count >= globalMaxLinks) return paragraph
  
  // First check if paragraph already has links and count them
  let existingLinkCount = 0
  function countLinks(node: any) {
    if (node.type === 'link') {
      existingLinkCount++
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(countLinks)
    }
  }
  countLinks(paragraph)
  
  // If paragraph already has any links, don't add more (max 1 per paragraph)
  if (existingLinkCount >= 1) {
    return paragraph
  }
  
  const newChildren: any[] = []
  let paragraphLinkCount = existingLinkCount // Start with existing links
  
  let linkAdded = false
  for (let i = 0; i < paragraph.children.length; i++) {
    const child = paragraph.children[i]
    if (paragraphLinkCount >= paragraphLinkLimit || globalLinkCount.count >= globalMaxLinks || linkAdded) {
      newChildren.push(child)
      continue
    }
    
    // Skip if already has link
    if (child.type === 'link' || child.type === 'autolink') {
      newChildren.push(child)
      continue
    }
    
    if (child.type === 'text' && child.text) {
      let text = child.text
      let segments: any[] = []
      let lastPos = 0
      let foundMatch = false
      
      // Sort products by anchor phrase length (longer first)
      const sortedProducts = [...products].sort((a, b) => {
        const aMaxLen = Math.max(...(a.anchorPhrases || []).map(p => p.length))
        const bMaxLen = Math.max(...(b.anchorPhrases || []).map(p => p.length))
        return bMaxLen - aMaxLen
      })
      
      // Try to find matches
      const matches: Array<{phrase: string, product: Product, index: number}> = []
      
      for (const product of sortedProducts) {
        if (!product.anchorPhrases || product.anchorPhrases.length === 0) continue
        
        for (const phrase of product.anchorPhrases) {
          if (!phrase || phrase.length < 2) continue
          if (globalUsedKeywords.has(phrase.toLowerCase())) continue
          
          const index = text.toLowerCase().indexOf(phrase.toLowerCase())
          if (index !== -1) {
            // Check if this keyword is part of a compound word
            if (!isPartOfCompoundWord(text, phrase, index)) {
              matches.push({ phrase, product, index })
            }
          }
        }
      }
      
      // Sort matches by position
      matches.sort((a, b) => a.index - b.index)
      
      // Process only first match in this text node (max 1 link per text child)
      const maxLinksToAdd = Math.min(1, paragraphLinkLimit - paragraphLinkCount)
      for (const match of matches.slice(0, maxLinksToAdd)) {
        if (paragraphLinkCount >= paragraphLinkLimit || globalLinkCount.count >= globalMaxLinks) break
        if (globalUsedKeywords.has(match.phrase.toLowerCase())) continue
        
        foundMatch = true
        
        // Text before keyword
        if (match.index > lastPos) {
          segments.push({
            type: 'text',
            text: text.substring(lastPos, match.index),
            format: child.format || 0
          })
        }
        
        // Create affiliate link
        const affiliateUrl = match.product.clean_url || match.product.affiliate_url
        segments.push({
          type: 'link',
          fields: {
            url: affiliateUrl,
            newTab: true,
            linkType: 'custom',
            rel: 'sponsored nofollow noopener'
          },
          children: [
            {
              type: 'text',
              text: '🛒 ' + text.substring(match.index, match.index + match.phrase.length),
              format: 0
            }
          ],
          format: '',
          indent: 0,
          version: 2
        })
        
        lastPos = match.index + match.phrase.length
        globalUsedKeywords.add(match.phrase.toLowerCase())
        paragraphLinkCount++
        globalLinkCount.count++
        linkAdded = true // Mark that we added a link
        break // Only add one link per text node
      }
      
      // Add remaining text
      if (foundMatch) {
        if (lastPos < text.length) {
          segments.push({
            type: 'text',
            text: text.substring(lastPos),
            format: child.format || 0
          })
        }
        newChildren.push(...segments)
        // After adding a link, push all remaining children without processing
        for (let j = i + 1; j < paragraph.children.length; j++) {
          newChildren.push(paragraph.children[j])
        }
        break // Stop processing this paragraph
      } else {
        newChildren.push(child)
      }
    } else {
      newChildren.push(child)
    }
  }
  
  return { ...paragraph, children: newChildren }
}

// Add links naturally throughout content
function addNaturalAffiliateLinks(node: any, products: Product[]): { content: any, linksAdded: number } {
  const globalUsedKeywords = new Set<string>()
  const globalLinkCount = { count: 0 }
  
  // Calculate distribution
  const totalParagraphs = countParagraphs(node)
  const targetLinks = Math.min(5, totalParagraphs) // Max 1 per paragraph, total max 5
  
  function processNode(n: any): any {
    if (isHeading(n)) return n
    
    if (n.type === 'paragraph') {
      // Process paragraph with natural limits
      return processParagraph(
        n, 
        products, 
        globalUsedKeywords,
        2, // Max 2 links per paragraph
        globalLinkCount,
        targetLinks
      )
    }
    
    // Process children recursively
    if (n.children && Array.isArray(n.children)) {
      return {
        ...n,
        children: n.children.map((child: any) => processNode(child))
      }
    }
    
    return n
  }
  
  const processedContent = processNode(node)
  return { content: processedContent, linksAdded: globalLinkCount.count }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    console.log('🚀 Processing posts for natural affiliate links...')
    
    // Load products
    const products = await loadProducts()
    
    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found. Please import products first.'
      }, { status: 400 })
    }
    
    console.log(`📦 Loaded ${products.length} active products`)
    
    // Get request body
    const { limit = 100 } = await request.json().catch(() => ({}))
    
    // First, clean all existing affiliate links
    console.log('🗑️  Removing existing affiliate links...')
    const allPosts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: limit,
      depth: 0
    })
    
    for (const post of allPosts.docs) {
      if (!post.content?.root) continue
      
      const contentStr = JSON.stringify(post.content)
      if (contentStr.includes('🛒')) {
        // Remove shopping cart icons
        const cleanContent = JSON.parse(contentStr.replace(/🛒\s*/g, ''))
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: { content: cleanContent },
          depth: 0
        })
      }
    }
    
    // Now add natural links
    console.log('📄 Adding natural affiliate links...')
    
    let processed = 0
    let skipped = 0
    let totalLinksAdded = 0
    const results = []
    
    // Re-fetch posts after cleaning
    const posts = await payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' }
      },
      limit: limit,
      depth: 0
    })
    
    for (const post of posts.docs) {
      try {
        if (!post.content?.root?.children) {
          console.log(`⏭️  No content: ${post.title}`)
          skipped++
          continue
        }
        
        console.log(`📝 Processing: ${post.title}`)
        
        const { content: updatedRoot, linksAdded } = addNaturalAffiliateLinks(
          post.content.root,
          products
        )
        
        if (linksAdded > 0) {
          // Update post
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: {
              content: {
                ...post.content,
                root: updatedRoot
              }
            },
            depth: 0
          })
          
          console.log(`   ✅ Added ${linksAdded} links naturally distributed`)
          processed++
          totalLinksAdded += linksAdded
          
          results.push({
            postId: post.id,
            title: post.title,
            linksAdded
          })
        } else {
          console.log(`   ⏭️  No matching keywords found`)
          skipped++
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing "${post.title}":`, error.message)
      }
    }
    
    const message = processed > 0 
      ? `Successfully added affiliate links to ${processed} posts. Average: ${(totalLinksAdded / processed).toFixed(1)} links per post.`
      : 'No posts were processed. They may not have matching keywords.'
    
    return NextResponse.json({
      success: true,
      message,
      processed,
      skipped,
      totalLinksAdded,
      averageLinksPerPost: processed > 0 ? (totalLinksAdded / processed).toFixed(1) : '0',
      results: results.slice(0, 10), // Return first 10 for preview
      distribution: '🌿 Natural Distribution: Max 2 links per paragraph, max 6 per article'
    })
    
  } catch (error: any) {
    console.error('Process posts error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process posts',
      details: error.message
    }, { status: 500 })
  }
}