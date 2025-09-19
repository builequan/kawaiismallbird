'use client'

import React, { useState, useRef, useEffect } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, ChevronDownIcon, Menu, X } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
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
    { label: '私たちについて', href: '/about-us' },
    {
      label: '小鳥の種類',
      href: '/birds',
      hasDropdown: true,
      dropdownItems: [
        { label: 'セキセイインコ', href: '/birds/budgerigars' },
        { label: 'オカメインコ', href: '/birds/cockatiels' },
        { label: 'コザクラインコ', href: '/birds/lovebirds' },
        { label: 'フィンチ類', href: '/birds/finches' },
        { label: 'マメルリハ', href: '/birds/parrotlets' },
        { label: 'カナリア', href: '/birds/canaries' },
        { label: '小型コニュア', href: '/birds/miniature-conures' },
      ]
    },
    {
      label: 'カテゴリー',
      href: '/categories',
      hasDropdown: true,
      hasNestedDropdown: true,
      dropdownItems: [
        {
          label: '飼育環境・ケージ設定',
          href: '/categories/housing',
          submenu: [
            { label: 'ケージのサイズと配置', href: '/categories/cage-setup' },
            { label: '照明とUV要件', href: '/categories/lighting' },
            { label: '止まり木の種類', href: '/categories/perches' },
            { label: '温度管理と換気', href: '/categories/temperature' },
            { label: 'おもちゃと遊具', href: '/categories/toys' },
          ]
        },
        {
          label: '健康・獣医ケア',
          href: '/categories/health',
          submenu: [
            { label: '定期健康診断', href: '/categories/wellness-exams' },
            { label: '一般的な呼吸器疾患', href: '/categories/respiratory' },
            { label: '羽の抜け替わり管理', href: '/categories/molting' },
            { label: '爪とくちばしのケア', href: '/categories/nail-beak' },
            { label: '寄生虫予防', href: '/categories/parasites' },
            { label: '緊急時の応急処置', href: '/categories/first-aid' },
          ]
        },
        {
          label: '栄養・餌やり',
          href: '/categories/nutrition',
          submenu: [
            { label: 'シードミックスvsペレット', href: '/categories/seed-pellet' },
            { label: '新鮮な野菜と果物', href: '/categories/fresh-foods' },
            { label: 'カルシウムとミネラル補給', href: '/categories/supplements' },
            { label: '給餌スケジュール', href: '/categories/feeding-schedule' },
            { label: '種類別の食事要件', href: '/categories/species-diet' },
          ]
        },
        {
          label: '行動・トレーニング',
          href: '/categories/training',
          submenu: [
            { label: '基本的なしつけ', href: '/categories/basic-training' },
            { label: '手乗り訓練', href: '/categories/hand-taming' },
            { label: '言葉を教える', href: '/categories/speech-training' },
            { label: '問題行動の対処', href: '/categories/behavior-issues' },
            { label: '社会化トレーニング', href: '/categories/socialization' },
          ]
        },
        {
          label: '法律・倫理・飼育の考慮',
          href: '/categories/legal',
          submenu: [
            { label: '飼育許可と規制', href: '/categories/permits' },
            { label: '責任ある飼育', href: '/categories/responsible-ownership' },
            { label: '倫理的な配慮', href: '/categories/ethical-considerations' },
          ]
        },
      ]
    },
    { label: 'お問い合わせ', href: '/contact' },
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
        <div
          key={i}
          className="relative"
          ref={item.hasDropdown ? dropdownRef : undefined}
          onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.label)}
          onMouseLeave={() => item.hasDropdown && setOpenDropdown(null)}
        >
          {item.hasDropdown ? (
            <>
              <button
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors duration-200 font-semibold px-4 py-2 rounded-full hover:bg-primary/10"
              >
                {item.label}
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  {item.dropdownItems.map((dropItem, idx) => (
                    <div
                      key={idx}
                      className="relative"
                      onMouseEnter={() => dropItem.submenu && setHoveredSubmenu(dropItem.label)}
                      onMouseLeave={() => dropItem.submenu && setHoveredSubmenu(null)}
                    >
                      {dropItem.submenu ? (
                        <>
                          <Link
                            href={dropItem.href}
                            className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium"
                          >
                            {dropItem.label}
                            <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                          </Link>

                          {/* Nested Submenu */}
                          {hoveredSubmenu === dropItem.label && (
                            <div className="absolute left-full top-0 ml-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                              {dropItem.submenu.map((subItem, subIdx) => (
                                <Link
                                  key={subIdx}
                                  href={subItem.href}
                                  className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium text-sm"
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          href={dropItem.href}
                          className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium"
                        >
                          {dropItem.label}
                        </Link>
                      )}
                    </div>
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
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        {item.label}
                        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="mt-2 ml-4 space-y-1">
                          {item.dropdownItems.map((dropItem, idx) => (
                            <div key={idx}>
                              {dropItem.submenu ? (
                                <>
                                  <button
                                    onClick={() => setHoveredSubmenu(hoveredSubmenu === dropItem.label ? null : dropItem.label)}
                                    className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                                  >
                                    {dropItem.label}
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${hoveredSubmenu === dropItem.label ? 'rotate-180' : ''}`} />
                                  </button>
                                  {hoveredSubmenu === dropItem.label && (
                                    <div className="mt-1 ml-4 space-y-1">
                                      {dropItem.submenu.map((subItem, subIdx) => (
                                        <Link
                                          key={subIdx}
                                          href={subItem.href}
                                          className="block px-4 py-1 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                          onClick={() => {
                                            setIsMobileMenuOpen(false)
                                            setOpenDropdown(null)
                                            setHoveredSubmenu(null)
                                          }}
                                        >
                                          {subItem.label}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Link
                                  href={dropItem.href}
                                  className="block px-4 py-2 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                                  onClick={() => {
                                    setIsMobileMenuOpen(false)
                                    setOpenDropdown(null)
                                  }}
                                >
                                  {dropItem.label}
                                </Link>
                              )}
                            </div>
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

          </div>
        </div>
      )}
    </>
  )
}
