'use client'

import React from 'react'
import Link from 'next/link'
import { Link as LinkIcon } from 'lucide-react'

const InternalLinksNav: React.FC = () => {
  return (
    <li>
      <Link 
        href="/admin/internal-links"
        className="nav-link"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
      >
        <LinkIcon size={16} />
        <span>Internal Links</span>
      </Link>
    </li>
  )
}

export default InternalLinksNav