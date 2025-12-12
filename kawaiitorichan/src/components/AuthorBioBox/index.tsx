'use client'

import React from 'react'
import Link from 'next/link'
import { User, Award, Calendar, ExternalLink } from 'lucide-react'

interface AuthorBioBoxProps {
  authorName?: string
  publishedAt?: string
  updatedAt?: string
  className?: string
}

export const AuthorBioBox: React.FC<AuthorBioBoxProps> = ({
  authorName = 'Kawaii Bird 編集部',
  publishedAt,
  updatedAt,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 my-8 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-900 text-lg">{authorName}</h4>
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3" />
              獣医師監修
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3">
            小鳥の飼育歴10年以上の愛鳥家チームです。セキセイインコ、オカメインコ、文鳥などの飼育経験を活かし、獣医師監修のもと信頼性の高い情報をお届けしています。
          </p>

          {/* Credentials */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
              飼育歴10年以上
            </span>
            <span className="inline-flex items-center text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
              獣医師監修記事
            </span>
            <span className="inline-flex items-center text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
              日本愛玩動物協会会員
            </span>
          </div>

          {/* Date Info */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>公開: {formatDate(publishedAt)}</span>
              </div>
            )}
            {updatedAt && updatedAt !== publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>更新: {formatDate(updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Link to About Page */}
          <Link
            href="/about-us"
            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm mt-3 font-medium"
          >
            編集部について詳しく見る
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Veterinarian Supervision Notice */}
      <div className="mt-4 pt-4 border-t border-orange-200">
        <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">獣医師監修コンテンツ</p>
            <p className="text-xs text-gray-600 mt-0.5">
              この記事は鳥類専門獣医師の監修のもと作成されています。医療に関する判断は必ず獣医師にご相談ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthorBioBox
