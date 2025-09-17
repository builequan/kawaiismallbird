'use client'

import React from 'react'

interface ProductRecommendationProps {
  productName: string
  price: string
  originalPrice?: string
  discount?: string
  url: string
  badge?: string
}

export const ProductRecommendationComponent: React.FC<ProductRecommendationProps> = ({
  productName,
  price,
  originalPrice,
  discount,
  url,
  badge = '人気 #1'
}) => {
  // Clean price to show number only
  const priceNumber = price.replace(/[^0-9,]/g, '')
  
  return (
    <div 
      style={{
        margin: '2rem auto',
        padding: '1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        maxWidth: '600px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🛍️</span>
        </div>
        <div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: 0 
          }}>
            おすすめ商品
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            margin: 0 
          }}>
            関連商品のご紹介
          </p>
        </div>
      </div>

      {/* Product Name */}
      <div style={{ marginBottom: '1rem' }}>
        <a 
          href={url}
          target="_blank"
          rel="nofollow sponsored"
          style={{
            color: '#1f2937',
            textDecoration: 'none',
            fontSize: '15px',
            lineHeight: '1.5',
            display: 'block'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
        >
          {productName}
        </a>
      </div>

      {/* Price Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        {badge && (
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            marginBottom: '8px'
          }}>
            {badge}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#059669' 
          }}>
            {priceNumber}
          </span>
          <span style={{ 
            fontSize: '18px', 
            color: '#059669',
            marginLeft: '4px' 
          }}>
            円
          </span>
          {originalPrice && (
            <span style={{
              fontSize: '14px',
              color: '#9ca3af',
              textDecoration: 'line-through',
              marginLeft: '12px'
            }}>
              {originalPrice}
            </span>
          )}
        </div>
        {discount && (
          <p style={{
            fontSize: '14px',
            color: '#dc2626',
            fontWeight: '600',
            marginTop: '4px'
          }}>
            {discount}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <a
        href={url}
        target="_blank"
        rel="nofollow sponsored"
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '16px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
      >
        詳細を見る
      </a>

      {/* Footer Note */}
      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        ※ 価格は変動する場合があります。リンク先でご確認ください。
      </p>
    </div>
  )
}