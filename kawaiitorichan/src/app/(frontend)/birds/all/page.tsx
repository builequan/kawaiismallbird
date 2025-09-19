import { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '全ての小鳥記事 | かわいい小鳥',
  description: '小鳥の飼い方、特徴、健康管理など、全ての小鳥に関する記事をご覧いただけます。セキセイインコ、オカメインコ、文鳥など様々な種類の情報を網羅。',
  openGraph: {
    title: '全ての小鳥記事 | かわいい小鳥',
    description: '小鳥の飼い方、特徴、健康管理など、全ての小鳥に関する記事をご覧いただけます。',
    images: ['/birds/natural_bird.webp'],
    locale: 'ja_JP',
    type: 'website',
  },
}

export default async function AllBirdArticlesPage() {
  const payload = await getPayload({ config })

  // Fetch all published posts
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 100,
    sort: '-publishedAt',
    depth: 3, // Increased depth to ensure content and media are loaded
  })

  // Group posts by category for better organization
  const birdKeywords = {
    'セキセイインコ': [],
    'オカメインコ': [],
    '文鳥': [],
    'カナリア': [],
    'コザクラインコ': [],
    'フィンチ': [],
    'その他': []
  } as Record<string, typeof posts>

  // Categorize posts
  posts.forEach(post => {
    const title = post.title.toLowerCase()
    let categorized = false

    Object.keys(birdKeywords).forEach(keyword => {
      if (keyword !== 'その他' && title.includes(keyword.toLowerCase())) {
        birdKeywords[keyword].push(post)
        categorized = true
      }
    })

    if (!categorized) {
      birdKeywords['その他'].push(post)
    }
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Nature Theme */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <Image
          src="/birds/bird_in_jungle.webp"
          alt="自然の中の小鳥たち"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            全ての小鳥記事
          </h1>
          <p className="text-lg md:text-xl text-center max-w-3xl mb-6">
            小鳥たちの魅力と飼育の知識を深める記事コレクション
          </p>
          <Badge className="bg-white/90 text-green-800 text-lg px-6 py-2">
            {posts.length}件の記事
          </Badge>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm" aria-label="パンくず">
          <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
            ホーム
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/#bird-types" className="text-gray-600 hover:text-green-600 transition-colors">
            鳥の種類
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold">全ての記事</span>
        </nav>
      </div>

      {/* Introduction Section */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  小鳥の知識を深めよう
                </h2>
                <p className="text-gray-700 mb-4">
                  このページでは、様々な小鳥に関する記事を一覧でご覧いただけます。
                  初心者の方から経験者の方まで、役立つ情報が満載です。
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>飼育方法とお世話のコツ</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>健康管理と病気予防</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>種類別の特徴と性格</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>環境づくりのアドバイス</span>
                  </li>
                </ul>
              </div>

              <div className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/birds/natural_bird.webp"
                  alt="美しい小鳥たち"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Environmental Message */}
            <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
              <p className="text-center text-gray-700 italic">
                「小鳥たちとの暮らしを通じて、自然の大切さを学び、
                より豊かな生活を送りましょう。正しい知識は、
                小鳥たちの幸せな生活につながります。」
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* All Articles Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          記事一覧
        </h2>

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            // Try to get hero image
            let heroImage = post.hero && typeof post.hero === 'object' && 'url' in post.hero
              ? post.hero
              : null

            // If no hero image, try to extract first image from content
            if (!heroImage && post.content) {
              try {
                // Check if content is Lexical format
                if (typeof post.content === 'object' && post.content.root) {
                  const findFirstImage = (node: any): any => {
                    // Check if this node is an upload (image)
                    if (node.type === 'upload' && node.value && typeof node.value === 'object') {
                      return node.value
                    }
                    // Check for inline images in text nodes
                    if (node.type === 'text' && node.text) {
                      // Look for image URLs in text (markdown style or direct URLs)
                      const imgMatch = node.text.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/) ||
                                      node.text.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i)
                      if (imgMatch) {
                        return { url: imgMatch[1] }
                      }
                    }
                    // Recursively search children
                    if (node.children && Array.isArray(node.children)) {
                      for (const child of node.children) {
                        const result = findFirstImage(child)
                        if (result) return result
                      }
                    }
                    return null
                  }

                  const firstImage = findFirstImage(post.content.root)
                  if (firstImage) {
                    heroImage = firstImage
                  }
                }
              } catch (e) {
                console.error('Error extracting image from content:', e)
              }
            }

            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden bg-white">
                <Link href={`/posts/${post.slug}`}>
                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {heroImage ? (
                      <Image
                        src={heroImage.url}
                        alt={heroImage.alt || post.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">🐦</div>
                      </div>
                    )}
                  </div>
                </Link>
                <CardHeader>
                  <CardTitle className="text-lg font-bold line-clamp-2 min-h-[3.5rem]">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="hover:text-green-600 transition-colors text-gray-900"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  {post.meta?.description && (
                    <CardDescription className="line-clamp-2 mt-2 text-sm">
                      {post.meta.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            )
          })}
        </div>

        {/* Quick Links to Bird Categories */}
        <div className="mt-16 pt-8 border-t">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            鳥の種類から探す
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/birds/budgerigar">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                セキセイインコ
              </Badge>
            </Link>
            <Link href="/birds/cockatiel">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                オカメインコ
              </Badge>
            </Link>
            <Link href="/birds/java-sparrow">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                文鳥
              </Badge>
            </Link>
            <Link href="/birds/canary">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                カナリア
              </Badge>
            </Link>
            <Link href="/birds/lovebird">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                コザクラインコ
              </Badge>
            </Link>
            <Link href="/birds/finch">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-green-50 hover:border-green-600 cursor-pointer">
                フィンチ
              </Badge>
            </Link>
            <Link href="/birds/others">
              <Badge variant="outline" className="text-base px-4 py-2 hover:bg-emerald-50 hover:border-emerald-600 cursor-pointer">
                その他の鳥と環境保護
              </Badge>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}