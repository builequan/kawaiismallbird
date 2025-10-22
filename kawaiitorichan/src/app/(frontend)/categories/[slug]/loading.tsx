export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-6" />
          <div className="h-12 w-3/4 max-w-3xl bg-white/20 rounded animate-pulse mb-4" />
          <div className="h-6 w-1/2 max-w-2xl bg-white/20 rounded animate-pulse mb-6" />
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
            <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Subcategories Grid Skeleton */}
        <div className="mb-12">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <div className="w-12 h-12 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Posts Grid Skeleton */}
        <div className="mb-12">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
                <div className="p-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
