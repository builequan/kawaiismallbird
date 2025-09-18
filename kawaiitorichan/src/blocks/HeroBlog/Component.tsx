'use client'

import type { HeroBlogBlock as HeroBlogBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  className?: string
} & HeroBlogBlockProps

const gradientClasses = {
  pinkPurple: 'bg-gradient-to-br from-pastel-pink via-pastel-lavender to-purple-200',
  mintBlue: 'bg-gradient-to-br from-pastel-mint via-pastel-blue to-blue-200',
  yellowOrange: 'bg-gradient-to-br from-pastel-yellow via-golden-yellow to-orange-200',
  lavenderPink: 'bg-gradient-to-br from-pastel-lavender via-pink-200 to-pastel-pink',
}

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

export const HeroBlogBlock: React.FC<Props> = ({ 
  className, 
  title, 
  subtitle, 
  ctaText, 
  ctaLink, 
  heroImage, 
  gradientStyle = 'pinkPurple',
  layout = 'center' 
}) => {
  const gradientClass = gradientClasses[gradientStyle] || gradientClasses.pinkPurple
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % birdImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className={cn('relative overflow-hidden min-h-screen', className)}>
      {/* Bird Images Slideshow Background */}
      <div className="absolute inset-0 w-full h-full z-10">
        {birdImages.map((image, index) => (
          <div
            key={image}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000',
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={image}
              alt={`鳥の画像 ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Grey fade overlay on left and right sides */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-transparent to-gray-900/40" />
        
        {/* Light overlay for text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      {/* Optional Background Image Overlay - keeping for backward compatibility */}
      {heroImage && typeof heroImage === 'object' && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={heroImage.url || ''}
            alt={heroImage.alt || ''}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative z-20">
        <div className="container mx-auto px-4">
          <div className={cn(
            'py-20 md:py-32',
            {
              'text-center': layout === 'center',
              'text-left': layout === 'left', 
              'text-right': layout === 'right',
            }
          )}>
            <div className={cn(
              'max-w-4xl',
              {
                'mx-auto': layout === 'center',
                'mr-auto': layout === 'left',
                'ml-auto': layout === 'right',
              }
            )}>
              {/* Main Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                {title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl lg:text-2xl text-white mb-8 leading-relaxed max-w-3xl drop-shadow-md">
                {subtitle}
              </p>

              {/* Call to Action Button */}
              {ctaText && ctaLink && (
                <div className={cn(
                  'flex gap-4',
                  {
                    'justify-center': layout === 'center',
                    'justify-start': layout === 'left',
                    'justify-end': layout === 'right',
                  }
                )}>
                  <Link
                    href={ctaLink}
                    className="inline-flex items-center px-8 py-4 bg-golden-yellow text-white font-semibold rounded-full hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {ctaText}
                    <svg 
                      className="ml-2 w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg 
          className="w-full h-12 md:h-20 text-white" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}