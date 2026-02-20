'use client'

import React from 'react'
import Link from 'next/link'
import { Award, Calendar, ExternalLink } from 'lucide-react'
import { teamMembers, veterinaryAdvisor, findTeamMember, getDefaultAuthor } from '@/data/team-members'
import type { TeamMember } from '@/data/team-members'

interface AuthorBioBoxProps {
  authorName?: string
  authorId?: string
  publishedAt?: string
  updatedAt?: string
  className?: string
}

export const AuthorBioBox: React.FC<AuthorBioBoxProps> = ({
  authorName,
  authorId,
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

  // Resolve the team member from authorId, authorName, or fallback to default
  let member: TeamMember | undefined
  if (authorId) {
    member = findTeamMember(authorId)
  }
  if (!member && authorName) {
    member = findTeamMember(authorName)
  }
  if (!member) {
    member = getDefaultAuthor()
  }

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 my-8 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Author Avatar with unique gradient */}
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 bg-gradient-to-br ${member.avatarGradient.from} ${member.avatarGradient.to} rounded-full flex items-center justify-center shadow-lg`}>
            <span className="text-xl font-bold text-white">
              {member.name.charAt(0)}
            </span>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-900 text-lg">{member.name}</h4>
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
              {member.roleShort}
            </span>
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3" />
              獣医師監修
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-3">
            {member.description}
          </p>

          {/* Credentials */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
              {member.experience}
            </span>
            {member.credentials.map((cred, i) => (
              <span key={i} className="inline-flex items-center text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
                {cred}
              </span>
            ))}
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
