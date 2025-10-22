export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="h-10 w-48 bg-white/20 rounded animate-pulse mb-6" />
          <div className="h-12 w-3/4 max-w-2xl bg-white/20 rounded animate-pulse mb-4" />
          <div className="h-6 w-1/2 max-w-xl bg-white/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Categories Grid Skeleton */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
