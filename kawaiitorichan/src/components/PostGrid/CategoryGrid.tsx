'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/utilities/ui'
import type { Category } from '@/payload-types'

interface CategoryGridProps {
  className?: string
  limit?: number
  title?: string
  subtitle?: string
}

const categoryIcons = [
  '🚀', '💻', '📱', '🎨', '📊', '🧠', '🌟', '📝', '🔬', '🎯'
]

const pastelBackgrounds = [
  'bg-pastel-pink',
  'bg-pastel-mint', 
  'bg-pastel-blue',
  'bg-pastel-lavender',
  'bg-pastel-yellow',
]

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  className,
  limit = 8,
  title = "カテゴリー",
  subtitle = "興味のあるトピックを探索してください"
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?limit=${limit}&sort=title`)
        const data = await response.json()
        
        if (data.docs) {
          setCategories(data.docs)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [limit])

  if (loading) {
    return (
      <section className={className}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded-lg mb-4 max-w-md mx-auto animate-pulse" />
            <div className="h-6 bg-gray-100 rounded-lg max-w-xl mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-32" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('py-16 bg-gray-50', className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const backgroundClass = pastelBackgrounds[index % pastelBackgrounds.length]
              const icon = categoryIcons[index % categoryIcons.length]
              const categoryImage = typeof category.image === 'object' ? category.image : null

              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <div className={cn(
                    'rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg group',
                    backgroundClass,
                    'hover:bg-opacity-80'
                  )}>
                    {/* Category Image or Icon */}
                    <div className="mb-4 flex justify-center">
                      {categoryImage ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={categoryImage.url || ''}
                            alt={categoryImage.alt || category.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center text-2xl">
                          {icon}
                        </div>
                      )}
                    </div>

                    {/* Category Title */}
                    <h3 className="text-center font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {category.title}
                    </h3>

                    {/* Category Description */}
                    {category.description && (
                      <p className="text-xs text-gray-600 text-center mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    {/* Post Count */}
                    <div className="text-center mt-3">
                      <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                        記事数: --
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7l2 2-2 2m0 8l2-2-2-2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">カテゴリーがまだありません</h3>
            <p className="text-gray-600">新しいカテゴリーが追加されるまでお待ちください。</p>
          </div>
        )}
      </div>
    </section>
  )
}