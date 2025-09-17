'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRightIcon, TagIcon, BirdIcon } from 'lucide-react'

export const CategorySidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  // Bird category items
  const categories = [
    {
      label: '鳥の種類',
      href: '/categories/bird-species',
      icon: '🦜',
      description: '様々な鳥の種類について'
    },
    {
      label: '観察用具',
      href: '/categories/birdwatching-gear',
      icon: '🔭',
      description: '観察に必要な道具'
    },
    {
      label: '撮影技術',
      href: '/categories/photography',
      icon: '📸',
      description: '鳥の撮影テクニック'
    },
    {
      label: '生息地',
      href: '/categories/habitats',
      icon: '🌳',
      description: '鳥の生息環境'
    },
    {
      label: '保護活動',
      href: '/categories/conservation',
      icon: '💚',
      description: '鳥の保護について'
    },
  ]

  const popularTags = [
    'インコ', 'オウム', '文鳥', 'カナリア', '野鳥観察',
    '鳥の飼育', '鳥の健康', '鳥の餌', '巣箱', '鳥の写真'
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-black p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label="カテゴリーメニュー"
      >
        <BirdIcon className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-24 right-0 lg:right-auto
        w-80 lg:w-full max-w-sm
        h-[calc(100vh-96px)] lg:h-auto
        bg-white lg:bg-transparent
        shadow-xl lg:shadow-none
        border-l lg:border-0 border-gray-200
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        z-40 lg:z-auto
        overflow-y-auto
      `}>
        <div className="p-6 lg:p-0">
          {/* Categories Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-primary" />
              カテゴリー
            </h3>
            <div className="space-y-2">
              {categories.map((category, idx) => (
                <Link
                  key={idx}
                  href={category.href}
                  className="group flex items-start gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all duration-200"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {category.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {category.description}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary mt-1 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Tags Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              人気のタグ
            </h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag, idx) => (
                <Link
                  key={idx}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-gray-100 hover:bg-primary/20 rounded-full text-sm text-gray-700 hover:text-primary transition-all duration-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-6 border border-primary/20">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ニュースレター
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              最新の鳥情報をお届けします！
            </p>
            <input
              type="email"
              placeholder="メールアドレス"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
            />
            <button className="w-full bg-primary text-black font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors">
              登録する
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}