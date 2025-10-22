import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { ReloadButton } from './ReloadButton'

// Prevent static generation - this page should only render at runtime
export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <WifiOff className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            オフラインです
          </h1>
          <p className="text-gray-600">
            インターネット接続を確認してください
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h2 className="font-semibold text-gray-900 mb-2">確認事項：</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Wi-Fiまたはモバイルデータがオンになっているか</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>機内モードがオフになっているか</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>ルーターやモデムの接続状態</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <ReloadButton />
            <Link
              href="/"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              ホームに戻る
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            一部のキャッシュされたページはオフラインでも閲覧できます
          </p>
        </div>
      </div>
    </div>
  )
}
