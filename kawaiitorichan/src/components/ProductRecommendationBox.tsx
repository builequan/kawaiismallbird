import React from 'react'
import Link from 'next/link'

interface ProductRecommendationBoxProps {
  productName: string
  price: string
  originalPrice?: string
  discount?: string
  url: string
  badge?: string
}

export const ProductRecommendationBox: React.FC<ProductRecommendationBoxProps> = ({
  productName,
  price,
  originalPrice,
  discount,
  url,
  badge = '人気 #1'
}) => {
  // Extract price number from string like "13,281円"
  const priceNumber = price.replace(/[^0-9,]/g, '')
  
  return (
    <div className="my-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">おすすめ商品</h3>
          <p className="text-sm text-gray-600">関連商品のご紹介</p>
        </div>
      </div>

      {/* Product Info */}
      <div className="mb-4">
        <Link href={url} target="_blank" rel="nofollow sponsored">
          <h4 className="text-base font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
            {productName}
          </h4>
        </Link>
      </div>

      {/* Price Section */}
      <div className="mb-4">
        {badge && (
          <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full mb-2">
            {badge}
          </span>
        )}
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-green-600">{priceNumber}</span>
          <span className="text-lg text-green-600 ml-1">円</span>
          {originalPrice && (
            <span className="text-sm text-gray-500 line-through ml-3">{originalPrice}</span>
          )}
        </div>
        {discount && (
          <p className="text-sm text-red-600 font-semibold mt-1">{discount}</p>
        )}
      </div>

      {/* CTA Button */}
      <Link 
        href={url}
        target="_blank"
        rel="nofollow sponsored"
        className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-lg transition-colors"
      >
        詳細を見る
      </Link>

      {/* Footer Note */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        ※ 価格は変動する場合があります。リンク先でご確認ください。
      </p>
    </div>
  )
}

// Inline version for embedding in articles
export const InlineProductBox: React.FC<ProductRecommendationBoxProps> = (props) => {
  return (
    <div className="inline-product-box">
      <ProductRecommendationBox {...props} />
      <style jsx global>{`
        .inline-product-box {
          margin: 2rem 0;
        }
        
        .inline-product-box .bg-white {
          background: #f8fdf8;
          border: 2px solid #e8f5e8;
        }
        
        .inline-product-box .bg-green-500 {
          background: #10b981;
        }
        
        .inline-product-box .text-green-600 {
          color: #059669;
        }
        
        .inline-product-box .bg-blue-600 {
          background: #2563eb;
        }
        
        .inline-product-box .bg-blue-600:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  )
}