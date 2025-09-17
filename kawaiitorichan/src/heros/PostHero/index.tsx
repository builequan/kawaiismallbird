import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="relative">
      {/* Hero Image */}
      {heroImage && typeof heroImage !== 'string' && (
        <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] -mt-20">
          <Media fill priority imgClassName="object-cover" resource={heroImage} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>
      )}
      
      {/* Content */}
      <div className="container relative z-10 -mt-32 lg:grid lg:grid-cols-[1fr_48rem_1fr] text-white">
        <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2 bg-transparent p-8">
          <div className="uppercase text-sm mb-6 text-white/80">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <React.Fragment key={index}>
                    {titleToUse}
                    {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
                  </React.Fragment>
                )
              }
              return null
            })}
          </div>

          <div className="">
            <h1 className="mb-6 text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">{title}</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-16">
            {hasAuthors && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-white/70">Author</p>

                  <p>{formatAuthors(populatedAuthors)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
