'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BirdData } from '@/utilities/generateStructuredData'

interface BirdInfoboxProps {
  bird: BirdData
  slug: string
  relatedBirds?: { slug: string; name: string }[]
}

/**
 * Wikipedia-style infobox component for bird species
 * Displays comprehensive entity information in a structured format
 * Optimized for entity-oriented SEO
 */
export function BirdInfobox({ bird, slug, relatedBirds }: BirdInfoboxProps) {
  // Calculate care level stars
  const getCareLevelStars = (level?: string) => {
    if (!level) return null
    if (level.includes('初心者')) return { stars: 1, label: '初心者向け' }
    if (level.includes('中級')) return { stars: 2, label: '中級者向け' }
    if (level.includes('上級') || level.includes('経験者')) return { stars: 3, label: '上級者向け' }
    return { stars: 1, label: level }
  }

  const careLevel = getCareLevelStars(bird.extendedInfo?.careLevel)

  return (
    <div className="bg-gradient-to-b from-green-50 to-white border border-green-200 rounded-lg overflow-hidden shadow-sm w-full max-w-sm">
      {/* Header with bird name */}
      <div className="bg-green-600 text-white px-4 py-3 text-center">
        <h2 className="text-xl font-bold">{bird.name}</h2>
        <p className="text-green-100 text-sm">{bird.englishName}</p>
      </div>

      {/* Bird image */}
      <div className="relative w-full h-48 bg-gray-100">
        <Image
          src={bird.image}
          alt={`${bird.name}（${bird.englishName}）の写真`}
          fill
          className="object-cover"
          sizes="(max-width: 384px) 100vw, 384px"
        />
      </div>

      {/* Scientific classification */}
      {bird.scientificName && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">学名</p>
          <p className="text-sm italic text-gray-700">{bird.scientificName}</p>
        </div>
      )}

      {/* Basic information table */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">
          基本情報
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">原産地</dt>
            <dd className="text-gray-900 font-medium text-right">{bird.basicInfo.origin}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">寿命</dt>
            <dd className="text-gray-900 font-medium">{bird.basicInfo.lifespan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">体長</dt>
            <dd className="text-gray-900 font-medium">{bird.basicInfo.size}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">体重</dt>
            <dd className="text-gray-900 font-medium">{bird.basicInfo.weight}</dd>
          </div>
        </dl>
      </div>

      {/* Extended attributes */}
      {bird.extendedInfo && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">
            飼育情報
          </h3>
          <dl className="space-y-2 text-sm">
            {bird.extendedInfo.dietType && (
              <div className="flex justify-between">
                <dt className="text-gray-500">食性</dt>
                <dd className="text-gray-900 font-medium text-right max-w-[60%]">{bird.extendedInfo.dietType}</dd>
              </div>
            )}
            {careLevel && (
              <div className="flex justify-between items-center">
                <dt className="text-gray-500">飼育難易度</dt>
                <dd className="text-gray-900 font-medium flex items-center gap-1">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${star <= careLevel.stars ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{careLevel.label}</span>
                </dd>
              </div>
            )}
            {bird.extendedInfo.noiseLevel && (
              <div className="flex justify-between">
                <dt className="text-gray-500">鳴き声</dt>
                <dd className="text-gray-900 font-medium">{bird.extendedInfo.noiseLevel}</dd>
              </div>
            )}
            {bird.extendedInfo.apartmentSuitable && (
              <div className="flex justify-between">
                <dt className="text-gray-500">マンション</dt>
                <dd className="text-gray-900 font-medium">{bird.extendedInfo.apartmentSuitable}</dd>
              </div>
            )}
            {bird.extendedInfo.talkingAbility && (
              <div className="flex justify-between">
                <dt className="text-gray-500">おしゃべり</dt>
                <dd className="text-gray-900 font-medium text-right max-w-[60%]">{bird.extendedInfo.talkingAbility}</dd>
              </div>
            )}
            {bird.extendedInfo.socialNeeds && (
              <div className="flex justify-between">
                <dt className="text-gray-500">社会性</dt>
                <dd className="text-gray-900 font-medium text-right max-w-[60%]">{bird.extendedInfo.socialNeeds}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Color variations */}
      {bird.extendedInfo?.colors && bird.extendedInfo.colors.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">カラーバリエーション</h3>
          <div className="flex flex-wrap gap-1">
            {bird.extendedInfo.colors.map((color, index) => (
              <span
                key={index}
                className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related species */}
      {relatedBirds && relatedBirds.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">関連する鳥</h3>
          <div className="flex flex-wrap gap-1">
            {relatedBirds.map((relatedBird) => (
              <Link
                key={relatedBird.slug}
                href={`/birds/${relatedBird.slug}`}
                className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
              >
                {relatedBird.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Wikipedia link */}
      {bird.extendedInfo?.wikipediaUrl && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <a
            href={bird.extendedInfo.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            Wikipedia で詳しく見る
          </a>
        </div>
      )}
    </div>
  )
}

export default BirdInfobox
