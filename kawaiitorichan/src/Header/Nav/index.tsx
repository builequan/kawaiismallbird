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
  const [isDropdownClicked, setIsDropdownClicked] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
        setIsDropdownClicked(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
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

  // Updated Japanese navigation items based on new category structure
  const japaneseNavItems = [
    { label: '私たちについて', href: '/about-us' },
    {
      label: 'カテゴリー',
      href: '/categories',
      hasDropdown: true,
      hasNestedDropdown: true,
      dropdownItems: [
        {
          label: '🦜 鳥の種類',
          href: '/categories/bird-species',
          submenu: [
            { label: 'セキセイインコ', href: '/categories/budgerigar' },
            { label: 'オカメインコ', href: '/categories/cockatiel' },
            { label: 'ラブバード', href: '/categories/lovebird' },
            { label: 'ゼブラフィンチ', href: '/categories/zebra-finch' },
            { label: '文鳥', href: '/categories/society-finch' },
            { label: 'ゴシキキンカン', href: '/categories/gouldian-finch' },
            { label: 'カナリア', href: '/categories/canary' },
            { label: 'マメルリハ', href: '/categories/parrotlet' },
            { label: 'ジュウシマツ', href: '/categories/munias' }
          ]
        },
        {
          label: '🏠 鳥の飼い方',
          href: '/categories/bird-care',
          submenu: [
            { label: 'ケージと飼育環境', href: '/categories/housing-enclosures' },
            { label: 'ケージサイズと設置', href: '/categories/cage-setup' },
            { label: '止まり木と設備', href: '/categories/perches-accessories' },
            { label: '温度と湿度管理', href: '/categories/temperature-humidity' },
            { label: '照明設備', href: '/categories/lighting' },
            { label: '清掃と衛生管理', href: '/categories/cleaning-hygiene' }
          ]
        },
        {
          label: '💊 鳥の健康',
          href: '/categories/bird-health',
          submenu: [
            { label: '日常の健康管理', href: '/categories/daily-health-care' },
            { label: '病気の症状と対処', href: '/categories/illness-treatment' },
            { label: '応急処置', href: '/categories/emergency-care' },
            { label: '獣医師の診察', href: '/categories/veterinary-care' },
            { label: '換羽期のケア', href: '/categories/molting-care' },
            { label: '繁殖と産卵', href: '/categories/breeding-care' }
          ]
        },
        {
          label: '🌿 鳥の生態',
          href: '/categories/bird-behavior',
          submenu: [
            { label: '鳴き声と意思疎通', href: '/categories/vocalizations' },
            { label: '行動パターン', href: '/categories/behavior-patterns' },
            { label: 'しつけと訓練', href: '/categories/training' },
            { label: 'ストレス管理', href: '/categories/stress-management' },
            { label: '社会性と多頭飼い', href: '/categories/social-behavior' },
            { label: '遊びと運動', href: '/categories/play-exercise' }
          ]
        },
        {
          label: '🔭 野鳥観察',
          href: '/categories/bird-watching',
          submenu: [
            { label: '観察の基本', href: '/categories/observation-basics' },
            { label: '観察場所', href: '/categories/observation-locations' },
            { label: '観察用具', href: '/categories/observation-equipment' },
            { label: '季節別観察', href: '/categories/seasonal-observation' },
            { label: '記録と写真', href: '/categories/recording-photography' },
            { label: '保護と環境', href: '/categories/conservation' }
          ]
        },
        {
          label: '🥗 餌と栄養',
          href: '/categories/nutrition-feeding',
          submenu: [
            { label: '基本的な餌', href: '/categories/basic-diet' },
            { label: '新鮮な野菜と果物', href: '/categories/fresh-foods' },
            { label: 'タンパク質源', href: '/categories/protein-sources' },
            { label: 'サプリメント', href: '/categories/supplements' },
            { label: '危険な食べ物', href: '/categories/toxic-foods' },
            { label: '給餌スケジュール', href: '/categories/feeding-schedule' },
            { label: '水分補給', href: '/categories/hydration' },
            { label: '季節別の栄養', href: '/categories/seasonal-nutrition' }
          ]
        }
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
          onMouseEnter={() => {
            if (item.hasDropdown && !isDropdownClicked) {
              // Clear any existing timeout
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              setOpenDropdown(item.label)
            }
          }}
          onMouseLeave={() => {
            if (item.hasDropdown && !isDropdownClicked) {
              // Add delay before closing
              timeoutRef.current = setTimeout(() => {
                setOpenDropdown(null)
              }, 300)
            }
          }}
        >
          {item.hasDropdown ? (
            <>
              <button
                onClick={() => {
                  if (openDropdown === item.label) {
                    setOpenDropdown(null)
                    setIsDropdownClicked(false)
                  } else {
                    setOpenDropdown(item.label)
                    setIsDropdownClicked(true)
                  }
                }}
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition-colors duration-200 font-semibold px-4 py-3 rounded-full hover:bg-primary/10 relative"
              >
                {item.label}
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu with invisible bridge for smooth hover */}
              {openDropdown === item.label && (
                <>
                  {/* Invisible bridge to prevent dropdown from closing when moving mouse */}
                  <div className="absolute top-full left-0 w-full h-4" />
                  <div
                    className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-3 z-50"
                    onMouseEnter={() => {
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isDropdownClicked) {
                        timeoutRef.current = setTimeout(() => {
                          setOpenDropdown(null)
                        }, 300)
                      }
                    }}
                  >
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
                            className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium rounded-md mx-2"
                            onClick={() => {
                              setOpenDropdown(null)
                              setIsDropdownClicked(false)
                            }}
                          >
                            {dropItem.label}
                            <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                          </Link>

                          {/* Nested Submenu with invisible bridge */}
                          {hoveredSubmenu === dropItem.label && (
                            <>
                              {/* Invisible bridge for smooth hover */}
                              <div className="absolute left-full top-0 w-4 h-full" />
                              <div className="absolute left-full top-0 ml-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-3">
                                {dropItem.submenu.map((subItem, subIdx) => (
                                  <Link
                                    key={subIdx}
                                    href={subItem.href}
                                    className="block px-4 py-2.5 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium text-sm rounded-md mx-2"
                                    onClick={() => {
                                      setOpenDropdown(null)
                                      setIsDropdownClicked(false)
                                      setHoveredSubmenu(null)
                                    }}
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <Link
                          href={dropItem.href}
                          className="block px-4 py-3 text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-150 font-medium rounded-md mx-2"
                          onClick={() => {
                            setOpenDropdown(null)
                            setIsDropdownClicked(false)
                          }}
                        >
                          {dropItem.label}
                        </Link>
                      )}
                    </div>
                  ))}
                  </div>
                </>
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
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setIsMobileMenuOpen(!isMobileMenuOpen)
        }}
        className="lg:hidden flex flex-col justify-center items-center w-12 h-12 rounded-lg active:bg-gray-100 transition-colors touch-manipulation z-[101]"
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
          className="lg:hidden fixed inset-x-0 top-[64px] bg-white shadow-xl border-t border-gray-200 z-[100] max-h-[calc(100vh-64px)] overflow-y-auto touch-pan-y"
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
                      <div className="flex items-center gap-1">
                        {/* Clickable main category link - takes most space */}
                        <Link
                          href={item.href}
                          className="flex-1 px-4 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg active:bg-primary/10 transition-colors touch-manipulation min-h-[48px] flex items-center"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setOpenDropdown(null)
                          }}
                        >
                          {item.label}
                        </Link>
                        {/* Toggle dropdown button - small on right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenDropdown(openDropdown === item.label ? null : item.label)
                          }}
                          className="px-3 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg active:bg-primary/10 transition-colors touch-manipulation min-h-[48px] flex items-center justify-center"
                          aria-label={`${item.label}メニューを${openDropdown === item.label ? '閉じる' : '開く'}`}
                        >
                          <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {openDropdown === item.label && (
                        <div className="mt-2 ml-4 space-y-1">
                          {item.dropdownItems.map((dropItem, idx) => (
                            <div key={idx}>
                              {dropItem.submenu ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    {/* Clickable category link (left side - takes up most space) */}
                                    <Link
                                      href={dropItem.href}
                                      className="flex-1 px-4 py-2 text-gray-700 active:text-primary active:bg-primary/5 rounded-lg transition-colors font-medium touch-manipulation min-h-[44px] flex items-center"
                                      onClick={() => {
                                        setIsMobileMenuOpen(false)
                                        setOpenDropdown(null)
                                        setHoveredSubmenu(null)
                                      }}
                                    >
                                      {dropItem.label}
                                    </Link>
                                    {/* Expand/collapse button (right side - small) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setHoveredSubmenu(hoveredSubmenu === dropItem.label ? null : dropItem.label)
                                      }}
                                      className="px-2 py-2 text-gray-700 active:text-primary active:bg-primary/5 rounded-lg transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                                      aria-label={`${dropItem.label}のサブメニューを${hoveredSubmenu === dropItem.label ? '閉じる' : '開く'}`}
                                    >
                                      <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${hoveredSubmenu === dropItem.label ? 'rotate-180' : ''}`} />
                                    </button>
                                  </div>
                                  {hoveredSubmenu === dropItem.label && (
                                    <div className="mt-1 ml-4 space-y-1">
                                      {dropItem.submenu.map((subItem, subIdx) => (
                                        <Link
                                          key={subIdx}
                                          href={subItem.href}
                                          className="block px-4 py-2 text-sm text-gray-600 active:text-primary active:bg-primary/5 rounded-lg transition-colors touch-manipulation min-h-[40px] flex items-center"
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
                                  className="block px-4 py-2 text-gray-700 active:text-primary active:bg-primary/5 rounded-lg transition-colors font-medium touch-manipulation min-h-[44px] flex items-center"
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
                      className="block px-4 py-3 text-gray-900 font-semibold bg-gray-50 rounded-lg active:bg-primary/10 transition-colors touch-manipulation min-h-[48px] flex items-center"
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
