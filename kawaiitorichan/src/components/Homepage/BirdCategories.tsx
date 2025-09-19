'use client'

import React from 'react'
import Link from 'next/link'
import { Bird, ChevronRight, Hash } from 'lucide-react'
import type { Category } from '@/payload-types'

interface CategoryWithCount extends Category {
  postCount: number
  icon?: string
  color?: string
}

interface BirdCategoriesProps {
  categories: CategoryWithCount[]
}

const categoryIcons: Record<string, { icon: string; color: string; bgGradient: string }> = {
  'インコ': { icon: '🦜', color: 'from-green-400 to-emerald-500', bgGradient: 'from-green-50 to-emerald-50' },
  'オウム': { icon: '🦜', color: 'from-blue-400 to-indigo-500', bgGradient: 'from-blue-50 to-indigo-50' },
  'フィンチ': { icon: '🐦', color: 'from-yellow-400 to-amber-500', bgGradient: 'from-yellow-50 to-amber-50' },
  'カナリア': { icon: '🐤', color: 'from-yellow-300 to-orange-400', bgGradient: 'from-yellow-50 to-orange-50' },
  '文鳥': { icon: '🕊️', color: 'from-gray-400 to-slate-500', bgGradient: 'from-gray-50 to-slate-50' },
  'セキセイインコ': { icon: '🦜', color: 'from-cyan-400 to-blue-500', bgGradient: 'from-cyan-50 to-blue-50' },
  'オカメインコ': { icon: '🦜', color: 'from-orange-400 to-red-500', bgGradient: 'from-orange-50 to-red-50' },
  'コンゴウインコ': { icon: '🦜', color: 'from-red-400 to-pink-500', bgGradient: 'from-red-50 to-pink-50' },
  'ラブバード': { icon: '💕', color: 'from-pink-400 to-rose-500', bgGradient: 'from-pink-50 to-rose-50' },
  'その他': { icon: '🪶', color: 'from-purple-400 to-violet-500', bgGradient: 'from-purple-50 to-violet-50' }
}

export const BirdCategories: React.FC<BirdCategoriesProps> = ({ categories }) => {
  const getCategoryStyle = (title: string) => {
    return categoryIcons[title] || categoryIcons['その他']
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-amber-50/20 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            鳥の種類から探す
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            お気に入りの鳥の種類から記事を見つけてください。各カテゴリーの記事数も表示しています。
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const style = getCategoryStyle(category.title)

            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group"
              >
                <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
                  {/* Background Pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.bgGradient} opacity-50`} />

                  {/* Content */}
                  <div className="relative p-6">
                    {/* Icon */}
                    <div className="text-5xl mb-4 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                      {style.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-600 group-hover:to-orange-600 transition-all duration-300">
                      {category.title}
                    </h3>

                    {/* Post Count Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r ${style.color} text-white text-sm font-semibold shadow-md`}>
                        <Hash className="w-3 h-3" />
                        <span>{category.postCount || 0}件</span>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-all duration-300 transform group-hover:translate-x-2" />
                    </div>

                    {/* Description if available */}
                    {category.description && (
                      <p className="mt-3 text-xs text-gray-600 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Hover Overlay Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${style.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                </div>
              </Link>
            )
          })}

          {/* View All Categories Card */}
          <Link
            href="/categories"
            className="group"
          >
            <div className="relative h-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="absolute inset-0 bg-white opacity-10" />

              <div className="relative p-6 text-white">
                <div className="text-5xl mb-4 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <Bird className="w-12 h-12" />
                </div>

                <h3 className="text-lg font-bold mb-2">
                  すべてのカテゴリー
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-90">すべて見る</span>
                  <ChevronRight className="w-5 h-5 transition-transform duration-300 transform group-hover:translate-x-2" />
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-white opacity-5 rounded-full" />
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '総記事数', value: categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0), icon: '📝' },
            { label: 'カテゴリー数', value: categories.length, icon: '📂' },
            { label: '今月の新記事', value: 24, icon: '✨' },
            { label: 'アクティブ著者', value: 8, icon: '✍️' }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}