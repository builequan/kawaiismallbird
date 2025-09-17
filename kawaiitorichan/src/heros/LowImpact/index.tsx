import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <section className="relative overflow-hidden h-[600px] md:h-[700px] lg:h-[800px] flex items-end">
      {/* Animated Birds with better visibility */}
      <div className="absolute top-20 right-10 text-4xl opacity-20 float-animation z-20">🦜</div>
      <div className="absolute top-40 left-20 text-3xl opacity-20 float-animation z-20" style={{ animationDelay: '1s' }}>🕊️</div>
      <div className="absolute bottom-40 right-40 text-4xl opacity-20 float-animation z-20" style={{ animationDelay: '2s' }}>🦅</div>

      {/* Text positioned at bottom with padding */}
      <div className="container-max relative z-10 pb-16 md:pb-20 lg:pb-24 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Direct text without background - text shadow for readability */}
          <div className="hero-text-shadow">
            {children || (richText && <RichText data={richText} enableGutter={false} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
