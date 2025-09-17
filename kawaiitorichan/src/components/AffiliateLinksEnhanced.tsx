'use client'

import React, { useEffect, useState } from 'react'

interface Product {
  id: string
  product_name: string
  affiliate_url: string
  price: string
  image_url?: string
}

interface AffiliateLinksEnhancedProps {
  postId: string
  content?: any
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

// Extract affiliate links from the article content
function extractAffiliateLinksFromContent(content: any): Array<{url: string, text: string}> {
  const links: Array<{url: string, text: string}> = []
  
  if (!content?.root?.children) return links
  
  // Recursively search for affiliate links in the content
  function searchNode(node: any) {
    if (node.type === 'link' && node.fields?.rel?.includes('sponsored')) {
      const url = node.fields.url || ''
      const text = extractTextFromNode(node.children)
      if (url && text) {
        links.push({ url, text })
      }
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(searchNode)
    }
  }
  
  function extractTextFromNode(children: any[]): string {
    if (!children) return ''
    return children.map(child => {
      if (child.type === 'text') return child.text
      if (child.children) return extractTextFromNode(child.children)
      return ''
    }).join('')
  }
  
  content.root.children.forEach(searchNode)
  
  return links
}

export default function AffiliateLinksEnhanced({ postId, content }: AffiliateLinksEnhancedProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Extract affiliate links from the content
    const affiliateLinks = extractAffiliateLinksFromContent(content)
    
    if (affiliateLinks.length === 0) {
      setLoading(false)
      return
    }
    
    // Load products index to match with article links
    fetch('/data/affiliate-links/products-index.json')
      .then(res => res.json())
      .then(productsData => {
        const matchedProducts: Product[] = []
        
        // Match the affiliate links from content with products
        for (const link of affiliateLinks) {
          // Find product by URL or by name
          const product = productsData.find((p: any) => {
            const productUrl = extractAffiliateUrl(p.affiliate_url)
            return productUrl === link.url || 
                   p.affiliate_url.includes(link.url) ||
                   link.url.includes('a8.net') && link.text.includes(p.product_name.substring(0, 20))
          })
          
          if (product && !matchedProducts.find(p => p.id === product.id)) {
            matchedProducts.push(product)
          }
          
          // Stop when we have 3 products
          if (matchedProducts.length >= 3) break
        }
        
        // Always try to get 3 products
        if (matchedProducts.length >= 3) {
          setProducts(matchedProducts.slice(0, 3))
        }
        // If not enough products found, add more from similarity matrix or defaults
        else {
          fetch('/data/affiliate-links/similarity-matrix.json')
            .then(res => res.json())
            .then(similarityData => {
              const postData = similarityData.find((item: any) => item.postId === postId)
              
              let finalProducts = [...matchedProducts]
              
              if (postData && postData.relevantProducts.length > 0) {
                const additionalProducts = postData.relevantProducts
                  .map((rp: any) => productsData.find((p: any) => p.id === rp.productId))
                  .filter(Boolean)
                  .slice(0, 3 - finalProducts.length)
                
                finalProducts = [...finalProducts, ...additionalProducts]
              }
              
              // If still not enough, just get some popular golf products
              if (finalProducts.length < 3) {
                const popularProducts = productsData
                  .filter((p: any) => !finalProducts.find(fp => fp.id === p.id))
                  .filter((p: any) => p.product_name.includes('ゴルフ') || p.product_name.includes('クラブ'))
                  .slice(0, 3 - finalProducts.length)
                
                finalProducts = [...finalProducts, ...popularProducts]
              }
              
              // Last resort - just get any products
              if (finalProducts.length < 3) {
                const anyProducts = productsData
                  .filter((p: any) => !finalProducts.find(fp => fp.id === p.id))
                  .slice(0, 3 - finalProducts.length)
                
                finalProducts = [...finalProducts, ...anyProducts]
              }
              
              setProducts(finalProducts.slice(0, 3))
            })
            .catch(() => setProducts(matchedProducts))
        }
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading products:', err)
        setLoading(false)
      })
  }, [postId, content])

  // Always try to show something - if no products matched, load some defaults
  if (loading) {
    return null
  }
  
  // If we have no products yet, return null (will be populated on next render)
  if (products.length === 0) {
    return null
  }

  return (
    <div className="mt-12 p-6 bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg border border-green-200">
      {/* Header with icon */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 00-8 0v6m8 0h4m-4 0a4 4 0 108 0h-4z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">おすすめ商品</h3>
          <p className="text-sm text-gray-600">記事内でご紹介した商品</p>
        </div>
      </div>
      
      {/* Products list */}
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                  {product.product_name}
                </h4>
                
                {/* Price */}
                {product.price && (
                  <div className="flex items-center text-green-600 font-bold text-lg mb-3">
                    <span>{product.price}</span>
                  </div>
                )}
              </div>
              
              {/* Ranking badge */}
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-3 flex-shrink-0">
                人気 #{index + 1}
              </span>
            </div>
            
            {/* CTA link without background */}
            <a 
              href={extractAffiliateUrl(product.affiliate_url)}
              target="_blank"
              rel="nofollow sponsored"
              className="inline-block text-blue-600 py-2 font-semibold text-sm hover:text-blue-800 hover:underline transition-colors"
            >
              詳細を見る →
            </a>
          </div>
        ))}
      </div>
      
      {/* Footer note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        ※ 価格は変動する場合があります。リンク先でご確認ください。
      </p>
    </div>
  )
}