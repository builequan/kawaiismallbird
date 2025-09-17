'use client'

import React, { useState, useRef, useEffect } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, ChevronDownIcon, Menu, X } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Static Japanese navigation items for bird site
  const japaneseNavItems = [
    { label: '私たちについて', href: '/about' },
    { label: 'カテゴリー', href: '/categories', hasDropdown: true },
    { label: 'ギャラリー', href: '/gallery' },
    { label: 'お問い合わせ', href: '/contact' },
  ]

  // Bird category items for dropdown
  const categoryItems = [
    { label: '鳥の種類', href: '/categories/bird-species' },
    { label: '観察用具', href: '/categories/birdwatching-gear' },
    { label: '撮影技術', href: '/categories/photography' },
    { label: '生息地', href: '/categories/habitats' },
    { label: '保護活動', href: '/categories/conservation' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex gap-6 items-center">
        {/* Japanese Navigation Items */}
        {japaneseNavItems.map((item, i) => (
        <div key={i} className="relative" ref={item.hasDropdown ? dropdownRef : undefined}>
          {item.hasDropdown ? (
            <>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors duration-200 font-semibold px-4 py-2 rounded-full hover:bg-primary/10"
              >
                {item.label}
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Categories Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  {categoryItems.map((category, idx) => (
                    <Link
                      key={idx}
                      href={category.href}
                      className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {category.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Link
              href={item.href}
              className="text-gray-700 hover:text-primary transition-colors duration-200 font-semibold px-4 py-2 rounded-full hover:bg-primary/10 inline-block"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}

      {/* CMS Navigation Items (fallback) */}
      {navItems.map(({ link }, i) => {
        return (
          <CMSLink 
            key={`cms-${i}`} 
            {...link} 
            appearance="link"
            className="text-gray-700 hover:text-primary transition-colors duration-200 font-semibold px-4 py-2 rounded-full hover:bg-primary/10 inline-block"
          />
        )
      })}

        {/* Enhanced Search Box */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-64 px-4 py-2 pl-10 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-black px-3 py-1 rounded-full text-sm hover:bg-primary/80 transition-colors duration-200 font-semibold"
            >
              検索
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="メニュー"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-900" />
        ) : (
          <Menu className="w-6 h-6 text-gray-900" />
        )}
      </button>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden fixed inset-x-0 top-[64px] bg-white shadow-xl border-t border-gray-200 z-50 max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          <div className="p-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="検索..."
                  className="w-full px-4 py-3 pl-10 text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>

            {/* Mobile Navigation Items */}
            <div className="space-y-2">
              {japaneseNavItems.map((item, i) => (
                <div key={i}>
                  {item.hasDropdown ? (
                    <div>
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        {item.label}
                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isDropdownOpen && (
                        <div className="mt-2 ml-4 space-y-1">
                          {categoryItems.map((category, idx) => (
                            <Link
                              key={idx}
                              href={category.href}
                              className="block px-4 py-2 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setIsDropdownOpen(false)
                              }}
                            >
                              {category.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-4 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Links Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">人気のカテゴリー</h3>
              <div className="grid grid-cols-2 gap-2">
                {categoryItems.slice(0, 4).map((category, idx) => (
                  <Link
                    key={idx}
                    href={category.href}
                    className="px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
