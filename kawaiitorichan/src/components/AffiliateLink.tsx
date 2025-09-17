'use client'

import React from 'react'
import Link from 'next/link'

interface AffiliateLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const AffiliateLink: React.FC<AffiliateLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored"
      className={`affiliate-link ${className}`}
      style={{
        color: '#2563eb',
        textDecoration: 'underline',
        textDecorationColor: '#2563eb',
        textUnderlineOffset: '3px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        position: 'relative',
        padding: '0 2px',
        display: 'inline-block'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#1d4ed8'
        e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'
        e.currentTarget.style.borderRadius = '3px'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#2563eb'
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderRadius = '0'
      }}
    >
      {children}
      <span 
        style={{
          fontSize: '0.75em',
          marginLeft: '3px',
          opacity: 0.8,
          display: 'inline-block'
        }}
      >
        🛒
      </span>
    </a>
  )
}

// CSS to inject for global affiliate link styling
export const affiliateLinkStyles = `
  /* Global affiliate link styles */
  a[rel*="sponsored"] {
    color: #2563eb !important;
    text-decoration: underline !important;
    text-decoration-color: #2563eb !important;
    text-underline-offset: 3px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    position: relative !important;
    padding: 0 2px !important;
  }
  
  a[rel*="sponsored"]:hover {
    color: #1d4ed8 !important;
    background-color: rgba(37, 99, 235, 0.08) !important;
    border-radius: 3px !important;
  }
  
  a[rel*="sponsored"]:visited {
    color: #7c3aed !important;
    text-decoration-color: #7c3aed !important;
  }
  
  /* Shopping cart emoji handled by React component - not CSS */
  /* Removed ::after content to prevent duplication */
`