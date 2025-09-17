import React from 'react'
import Link from 'next/link'

interface AffiliateProduct {
  name: string
  price: string
  url: string
  rank?: number
}

interface AffiliateShowcaseProps {
  products: AffiliateProduct[]
}

export const AffiliateShowcase: React.FC<AffiliateShowcaseProps> = ({ products }) => {
  if (!products || products.length === 0) return null
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 my-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 m-0">おすすめ商品</h3>
          <p className="text-sm text-gray-600 m-0">記事内でご紹介した商品</p>
        </div>
      </div>
      
      {/* Products */}
      <div className="space-y-0 divide-y divide-gray-200">
        {products.map((product, index) => (
          <div key={index} className="py-5 relative">
            {/* Ranking Badge */}
            {(product.rank || index < 3) && (
              <div className="absolute top-5 right-0 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                人気 #{product.rank || index + 1}
              </div>
            )}
            
            {/* Product Name */}
            <h4 className="text-base font-semibold text-gray-900 pr-20 mb-2">
              {product.name}
            </h4>
            
            {/* Price */}
            <p className="text-2xl font-bold text-green-600 mb-3">
              {product.price}
            </p>
            
            {/* Link */}
            <a
              href={product.url}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              詳細を見る
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AffiliateShowcase