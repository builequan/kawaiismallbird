export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6" />

        {/* Article Header Skeleton */}
        <header className="mb-8">
          <div className="h-12 w-full bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse mb-6" />

          {/* Meta Info Skeleton */}
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Categories Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </header>

        {/* Hero Image Skeleton */}
        <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse mb-8" />

        {/* Excerpt Skeleton */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="prose max-w-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="mb-6">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Related Posts Skeleton */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-40 bg-gray-200 animate-pulse" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}
