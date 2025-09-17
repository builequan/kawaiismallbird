'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

const birdImages = [
  '/birdimage/download.webp',
  '/birdimage/download (1).webp',
  '/birdimage/download (2).webp',
  '/birdimage/download (3).webp',
  '/birdimage/download (4).webp',
  '/birdimage/download (5).webp',
  '/birdimage/download (6).webp',
  '/birdimage/download (7).webp',
  '/birdimage/download (8).webp',
]

export const ImageSlideshow: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % birdImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Image container with full size */}
      <div className="absolute inset-0">
        {birdImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`鳥の画像 ${index + 1}`}
              fill
              style={{ objectFit: 'cover' }}
              priority={index === 0}
              quality={100}
              sizes="100vw"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ))}
      </div>

      {/* Subtle gradient overlay only at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {birdImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`画像 ${index + 1} に移動`}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">画像を読み込み中...</div>
        </div>
      )}
    </div>
  )
}