'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface BirdTypesGridProps {
  categories: { id: string; title: string; slug: string; postCount: number }[]
}

// Define actual bird species with custom icons - 7 types only
const birdSpeciesData = [
  { name: 'セキセイインコ', iconPath: '/birdicons/セキセイインコ .webp', color: 'from-green-50 to-green-100', slug: 'budgerigar' },
  { name: 'オカメインコ', iconPath: '/birdicons/オカメインコ.webp', color: 'from-yellow-50 to-orange-100', slug: 'cockatiel' },
  { name: '文鳥', iconPath: '/birdicons/文鳥.webp', color: 'from-gray-50 to-gray-100', slug: 'java-sparrow' },
  { name: 'カナリア', iconPath: '/birdicons/カナリア.webp', color: 'from-yellow-50 to-yellow-100', slug: 'canary' },
  { name: 'コザクラインコ', iconPath: '/birdicons/コザクラインコ .webp', color: 'from-pink-50 to-rose-100', slug: 'lovebird' },
  { name: 'フィンチ', iconPath: '/birdicons/フィンチ.webp', color: 'from-amber-50 to-orange-100', slug: 'finch' },
  { name: 'その他の鳥', iconPath: '/birdicons/その他.webp', color: 'from-purple-50 to-indigo-100', slug: 'others' },
]

export const BirdTypesGrid: React.FC<BirdTypesGridProps> = ({ categories }) => {
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          鳥の種類から探す
        </h2>

        {/* Bird Species Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 md:gap-6">
          {birdSpeciesData.map((bird, index) => {
            return (
              <Link
                key={index}
                href={`/birds/${bird.slug}`}
                className={`group relative flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl transition-all duration-300 bg-gradient-to-br ${bird.color} hover:shadow-xl border-2 border-gray-200 hover:border-amber-300`}
              >
                {/* Bird Icon */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={bird.iconPath}
                    alt={bird.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 80px, 96px"
                  />
                </div>

                {/* Bird Name */}
                <span className="text-sm md:text-base font-bold text-center text-gray-800 group-hover:text-amber-600">
                  {bird.name}
                </span>

              </Link>
            )
          })}

          {/* All Articles Card */}
          <Link
            href="/birds/all"
            className="
              group flex flex-col items-center justify-center
              p-5 md:p-6 rounded-2xl transition-all duration-300
              bg-gradient-to-br from-gray-50 to-gray-100
              hover:from-gray-100 hover:to-gray-200 hover:shadow-lg
              border-2 border-gray-200 hover:border-gray-300
            "
          >
            <div className="text-4xl md:text-5xl mb-3 transition-transform duration-300 group-hover:scale-110">
              📚
            </div>
            <span className="text-sm md:text-base font-bold text-gray-700">
              全て記事
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}