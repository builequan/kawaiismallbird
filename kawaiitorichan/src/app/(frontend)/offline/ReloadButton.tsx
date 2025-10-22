'use client'

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      再読み込み
    </button>
  )
}
