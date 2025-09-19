'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'

interface BirdType {
  id: string
  name: string
  slug: string
  icon: string
  count: number
}

interface BirdTypesPillsProps {
  categories: { id: string; title: string; slug: string; postCount: number }[]
}

const birdTypeIcons: Record<string, string> = {
  'インコ': '🦜',
  'オウム': '🦜',
  'フィンチ': '🐦',
  'カナリア': '🐤',
  '文鳥': '🕊️',
  'セキセイインコ': '🦜',
  'オカメインコ': '🦜',
  'コンゴウインコ': '🦜',
  'ラブバード': '💕',
  'その他': '🪶'
}

export const BirdTypesPills: React.FC<BirdTypesPillsProps> = ({ categories }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const getIcon = (title: string) => {
    return birdTypeIcons[title] || birdTypeIcons['その他']
  }

  return (
    <section className="py-6 md:py-10 bg-gradient-to-b from-white to-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title - Compact for Mobile */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
          鳥の種類から探す
        </h2>

        {/* Horizontal Scrollable Pills Container */}
        <div className="relative">
          {/* Scroll Hint Gradient - Mobile Only */}
          <div className="md:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />

          {/* Pills Container */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {categories.map((category) => {
              const icon = getIcon(category.title)
              const isSelected = selectedType === category.id

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedType(category.id === selectedType ? null : category.id)
                  }}
                  className={`
                    flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3
                    rounded-full font-medium transition-all duration-300
                    ${isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-400 hover:shadow-md'
                    }
                    active:scale-95 touch-manipulation
                  `}
                >
                  <span className="text-lg md:text-xl">{icon}</span>
                  <span className="text-sm md:text-base whitespace-nowrap">
                    {category.title}
                  </span>
                  <span className={`
                    text-xs md:text-sm font-bold
                    ${isSelected ? 'text-white' : 'text-amber-600'}
                  `}>
                    ({category.postCount})
                  </span>
                </Link>
              )
            })}

            {/* View All Pill */}
            <Link
              href="/categories"
              className="
                flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3
                rounded-full font-medium transition-all duration-300
                bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700
                hover:from-gray-200 hover:to-gray-300 hover:shadow-md
                active:scale-95 touch-manipulation
              "
            >
              <span className="text-lg md:text-xl">📚</span>
              <span className="text-sm md:text-base whitespace-nowrap">
                すべて見る
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <p className="md:hidden text-xs text-gray-500 text-center mt-3">
          ← スワイプして他の種類を見る →
        </p>
      </div>
    </section>
  )
}