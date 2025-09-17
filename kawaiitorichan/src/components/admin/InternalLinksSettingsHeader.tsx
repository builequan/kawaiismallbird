'use client'

import React from 'react'
import Link from 'next/link'

export const InternalLinksSettingsHeader: React.FC = () => {
  return (
    <div style={{ 
      marginBottom: '24px', 
      padding: '16px', 
      backgroundColor: '#f0f9ff', 
      border: '1px solid #bfdbfe',
      borderRadius: '8px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            Internal Links Configuration
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Configure settings for automatic internal linking system
          </p>
        </div>
        <Link 
          href="/admin/internal-links"
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Open Links Manager
        </Link>
      </div>
      <div style={{ 
        marginTop: '12px', 
        padding: '12px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fde68a',
        borderRadius: '6px' 
      }}>
        <strong style={{ fontSize: '14px' }}>🔧 Need to manage links?</strong>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#78716c' }}>
          Use the Links Manager to:
          • View statistics and link distribution
          • Process or remove links from selected posts
          • Remove ALL internal links from all posts at once
        </p>
      </div>
    </div>
  )
}

export default InternalLinksSettingsHeader