'use client'

import React, { useEffect, useState } from 'react'

interface Product {
  id: string
  product_name: string
  affiliate_url: string
  price: string
}

interface AffiliateLinksProps {
  postId: string
}

function extractAffiliateUrl(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (match && match[1].includes('a8')) {
    return match[1]
  }
  return html
}

export default function AffiliateLinks({ postId }: AffiliateLinksProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load affiliate links data
    fetch('/data/affiliate-links/similarity-matrix.json')
      .then(res => res.json())
      .then(async (similarityData) => {
        // Find this post's recommendations
        const postData = similarityData.find((item: any) => item.postId === postId)
        
        if (postData && postData.relevantProducts.length > 0) {
          // Load products index
          const productsRes = await fetch('/data/affiliate-links/products-index.json')
          const productsData = await productsRes.json()
          
          // Get the first 2 recommended products
          const recommendedProducts = postData.relevantProducts
            .slice(0, 2)
            .map((rp: any) => {
              return productsData.find((p: any) => p.id === rp.productId)
            })
            .filter(Boolean)
          
          setProducts(recommendedProducts)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading affiliate links:', err)
        setLoading(false)
      })
  }, [postId])

  if (loading || products.length === 0) {
    return null
  }

  return (
    <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-900">おすすめ商品</h3>
      
      {products.map((product, index) => (
        <div key={product.id} className="mb-6">
          <p className="font-semibold text-gray-900">{product.product_name}</p>
          <p className="text-gray-700">価格: {product.price}</p>
          <p className="mt-2">
            <a 
              href={extractAffiliateUrl(product.affiliate_url)}
              target="_blank"
              rel="nofollow sponsored"
              className="text-blue-600 underline hover:text-blue-800 font-medium"
            >
              詳細を見る →
            </a>
          </p>
        </div>
      ))}
    </div>
  )
}