'use client'

import React, { useEffect, useRef } from 'react'

interface Product {
  id: string
  product_name: string
  keyword_research: string
  keywords: string[]
  affiliate_url: string
}

interface ContentWithAffiliateLinksProps {
  postId: string
  children: React.ReactNode
  products?: Product[] // Pass products from server
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

export default function ContentWithAffiliateLinksOptimized({ 
  postId, 
  children,
  products = [] 
}: ContentWithAffiliateLinksProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current || products.length === 0) return

    // Track which keywords have been linked (to avoid duplicates)
    const linkedKeywords = new Set<string>()
    let linksAdded = 0
    const maxLinks = 5

    // Process all paragraph and list elements
    const textElements = contentRef.current.querySelectorAll('p, li')
    
    textElements.forEach(element => {
      // Skip if we've added enough links
      if (linksAdded >= maxLinks) return
      
      // Skip headings
      if (element.closest('h1, h2, h3, h4, h5, h6')) return
      
      // Process each text node in the element
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip if parent is already a link
            if (node.parentElement?.tagName === 'A') {
              return NodeFilter.FILTER_REJECT
            }
            return NodeFilter.FILTER_ACCEPT
          }
        }
      )
      
      const textNodes: Node[] = []
      let node
      while (node = walker.nextNode()) {
        textNodes.push(node)
      }
      
      // Process each text node
      for (const textNode of textNodes) {
        if (linksAdded >= maxLinks) break
        if (!textNode.textContent) continue
        
        let modified = false
        const originalText = textNode.textContent
        
        // Try to find a keyword match
        for (const product of products) {
          if (linksAdded >= maxLinks) break
          if (modified) break
          
          // Collect all possible keywords for this product
          const allKeywords = [
            product.keyword_research,
            ...(product.keywords || [])
          ].filter(k => k && k.length > 2) // Min 3 characters
          
          // Find the first unlinked keyword
          for (const keyword of allKeywords) {
            // Skip if already linked
            if (linkedKeywords.has(keyword.toLowerCase())) continue
            
            // Check if this keyword exists in the text
            if (!originalText.includes(keyword)) continue
            
            // Create the link
            const url = extractAffiliateUrl(product.affiliate_url)
            const link = document.createElement('a')
            link.href = url
            link.target = '_blank'
            link.rel = 'nofollow sponsored'
            link.style.cssText = 'color: #0066cc !important; text-decoration: underline !important; font-weight: 500 !important;'
            
            // Split text and insert link
            const keywordIndex = originalText.indexOf(keyword)
            const beforeText = originalText.substring(0, keywordIndex)
            const keywordText = originalText.substring(keywordIndex, keywordIndex + keyword.length)
            const afterText = originalText.substring(keywordIndex + keyword.length)
            
            // Create new text nodes and link
            const beforeNode = document.createTextNode(beforeText)
            link.textContent = keywordText
            const afterNode = document.createTextNode(afterText)
            
            // Replace the original text node
            const parent = textNode.parentNode
            if (parent) {
              parent.insertBefore(beforeNode, textNode)
              parent.insertBefore(link, textNode)
              parent.insertBefore(afterNode, textNode)
              parent.removeChild(textNode)
              
              // Mark as linked
              linkedKeywords.add(keyword.toLowerCase())
              linksAdded++
              modified = true
              break
            }
          }
        }
      }
    })
  }, [products])

  return (
    <div ref={contentRef}>
      {children}
    </div>
  )
}