import React from 'react'
import { ImageSlideshow } from '@/components/ImageSlideshow'
import { BirdTypesGrid } from './BirdTypesGrid'
import { ArticleCarousel } from './ArticleCarousel'
import { MobileArticleCards } from './MobileArticleCards'
import { PopularArticles } from './PopularArticles'
import type { Post, Category } from '@/payload-types'

interface ModernHomepageProps {
  featuredPosts: Post[]
  recentPosts: Post[]
  popularPosts: Post[]
  categories: (Category & { postCount: number })[]
}

export const ModernHomepage: React.FC<ModernHomepageProps> = ({
  featuredPosts,
  recentPosts,
  popularPosts,
  categories
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* 1. Image Slideshow - Original bird photos */}
      <section className="relative">
        <ImageSlideshow />
      </section>

      {/* 2. Bird Types Grid - Matches the design from image */}
      <BirdTypesGrid categories={categories} />

      {/* 3. Featured Articles Carousel - Hidden on mobile, shown on desktop */}
      <section className="hidden md:block bg-gradient-to-b from-amber-50/30 to-white">
        <ArticleCarousel posts={featuredPosts} />
      </section>

      {/* 4. Recent Articles - Mobile optimized cards */}
      <MobileArticleCards
        posts={recentPosts}
        title="最新の記事"
        showViewAll={true}
      />

      {/* 5. Popular Articles - Desktop only */}
      <div className="hidden lg:block">
        <PopularArticles posts={popularPosts} />
      </div>

      {/* Mobile Popular Articles - Simplified version */}
      <div className="lg:hidden">
        <MobileArticleCards
          posts={popularPosts.slice(0, 3)}
          title="人気の記事"
          showViewAll={true}
        />
      </div>
    </div>
  )
}