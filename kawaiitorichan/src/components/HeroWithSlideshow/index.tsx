'use client'

import React from 'react'
import { ImageSlideshow } from '@/components/ImageSlideshow'
import { RenderHero } from '@/heros/RenderHero'
import type { Page } from '@/payload-types'

interface HeroWithSlideshowProps {
  hero: Page['hero']
}

export const HeroWithSlideshow: React.FC<HeroWithSlideshowProps> = ({ hero }) => {
  return (
    <div className="relative">
      {/* Background slideshow */}
      <div className="absolute inset-0 z-0">
        <ImageSlideshow />
      </div>

      {/* Hero content overlay */}
      <div className="relative z-10">
        <RenderHero {...hero} />
      </div>
    </div>
  )
}