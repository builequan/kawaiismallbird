import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getCachedPayload } from '@/lib/payload-singleton'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichTextWithFilteredReferences from '@/components/RichTextWithFilteredReferences'
import ImportedPostContent from '@/components/ImportedPostContent'
import AffiliateLinksEnhanced from '@/components/AffiliateLinksEnhanced'
import ContentWithAffiliateLinksOptimized from '@/components/ContentWithAffiliateLinksOptimized'
import SemanticRelatedPosts from '@/components/SemanticRelatedPosts'
import PostReferences from '@/components/PostReferences'
import fs from 'fs/promises'
import path from 'path'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  // Skip static generation during build if no database connection
  if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
    return []
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const posts = await payload.find({
      collection: 'posts',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    const params = posts.docs.map(({ slug }) => {
      return { slug }
    })

    return params
  } catch (error) {
    console.warn('Failed to generate static params for posts:', error)
    return []
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/posts/' + slug
  const post = await queryPostBySlug({ slug })

  if (!post) return <PayloadRedirects url={url} />

  // Load similarity data to find related posts
  let similarPosts: Array<{ id: string; slug: string; score: number }> = []
  let affiliateProducts: any[] = []
  
  // Load similarity data for related posts
  try {
    const similarityPath = path.join(process.cwd(), 'data', 'internal-links', 'similarity-matrix.json')
    const similarityContent = await fs.readFile(similarityPath, 'utf-8')
    const similarityData = JSON.parse(similarityContent)
    
    // Get similar posts for current post
    const postSimilarities = similarityData.similarities[String(post.id)]
    if (postSimilarities && postSimilarities.similar) {
      similarPosts = postSimilarities.similar
    }
  } catch (error) {
    // Silently fail - similarity is optional
    console.log('Could not load similarity data:', error)
  }
  
  // Load affiliate products data
  try {
    const affiliatePath = path.join(process.cwd(), 'public', 'data', 'affiliate-links', 'similarity-matrix.json')
    const productsPath = path.join(process.cwd(), 'public', 'data', 'affiliate-links', 'products-index.json')
    
    const [affiliateData, productsData] = await Promise.all([
      fs.readFile(affiliatePath, 'utf-8').then(d => JSON.parse(d)).catch(() => []),
      fs.readFile(productsPath, 'utf-8').then(d => JSON.parse(d)).catch(() => [])
    ])
    
    const postData = affiliateData.find((item: any) => item.postId === String(post.id))
    if (postData && postData.relevantProducts && postData.relevantProducts.length > 0) {
      affiliateProducts = postData.relevantProducts
        .map((rp: any) => productsData.find((p: any) => p.id === rp.productId))
        .filter(Boolean)
        .slice(0, 5) // Limit to 5 products
    }
  } catch (error) {
    // Silently fail - affiliate links are optional
  }

  return (
    <article className="pt-16 pb-16 bg-post-green text-gray-900">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8 text-gray-900">
        <div className="container lg:grid lg:grid-cols-[1fr_48rem_1fr]">
          <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2 px-8 pb-8 text-gray-900">
            {/* Wrap content to add inline affiliate links */}
            <ContentWithAffiliateLinksOptimized postId={String(post.id)} products={affiliateProducts}>
              {/* Use filtered RichText that excludes reference sections */}
              <RichTextWithFilteredReferences className="text-gray-900 [&_*]:text-gray-900" content={post.content} />
            </ContentWithAffiliateLinksOptimized>

            {/* Display collapsible references if found in content */}
            <PostReferences content={post.content} />

            {/* Display enhanced affiliate product recommendations with products from the article */}
            <AffiliateLinksEnhanced postId={post.id} content={post.content} />
          </div>
        </div>
        
        {/* Display semantic related posts based on content similarity - Full Width */}
        <SemanticRelatedPosts 
          currentPostId={post.id}
          similarPosts={similarPosts}
        />
        
        {/* Fallback to manually selected related posts if available */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="container mx-auto px-4 mt-12">
            <RelatedPosts
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          </div>
        )}
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const post = await queryPostBySlug({ slug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  // Use cached payload instance in production
  const payload = process.env.NODE_ENV === 'production' 
    ? await getCachedPayload()
    : await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    depth: 2, // Need depth 2 to populate media in upload nodes
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
