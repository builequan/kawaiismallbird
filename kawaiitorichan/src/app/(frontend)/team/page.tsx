import type { Metadata } from 'next'
import React from 'react'
import Link from 'next/link'
import { User, Award, BookOpen, Heart, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '編集部・監修者紹介 | Kawaii Bird - 小鳥の飼育情報サイト',
  description: 'Kawaii Bird編集部と監修獣医師のご紹介。小鳥の飼育歴10年以上の愛鳥家チームと鳥類専門獣医師が、信頼性の高い情報をお届けします。',
}

const teamMembers = [
  {
    name: 'Kawaii Bird 編集長',
    role: '編集長・コンテンツ責任者',
    experience: '小鳥飼育歴15年',
    birds: 'セキセイインコ、オカメインコ',
    description: 'セキセイインコとの出会いをきっかけに小鳥の魅力に取り憑かれ、現在は3羽のインコと暮らしています。正確で実践的な情報発信を心がけています。',
    credentials: ['日本愛玩動物協会会員', '愛玩動物飼養管理士'],
  },
  {
    name: 'ライター A',
    role: '健康・栄養担当ライター',
    experience: '小鳥飼育歴12年',
    birds: '文鳥、十姉妹',
    description: '文鳥との暮らしから小鳥の健康管理の重要性を学びました。獣医師への取材を通じて、正確な健康情報をわかりやすくお伝えしています。',
    credentials: ['ペット栄養管理士', '動物看護助手'],
  },
  {
    name: 'ライター B',
    role: '飼育環境・用品担当ライター',
    experience: '小鳥飼育歴10年',
    birds: 'カナリア、錦華鳥',
    description: '快適なケージ環境づくりを追求し、様々な飼育用品をテストしてきました。初心者の方にもわかりやすい情報をお届けします。',
    credentials: ['ペットショップ勤務経験あり'],
  },
]

const veterinaryAdvisor = {
  title: '監修獣医師',
  description: '当サイトの医療・健康に関する記事は、鳥類診療を専門とする獣医師の監修のもと作成されています。',
  credentials: [
    '獣医師免許取得',
    '鳥類診療専門',
    '臨床経験10年以上',
    'Association of Avian Veterinarians会員',
  ],
  note: '※監修獣医師のプライバシー保護のため、個人名の公開は控えさせていただいております。',
}

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            編集部・監修者紹介
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            小鳥を愛するプロフェッショナルチームが、
            あなたと小鳥の幸せな暮らしをサポートします
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Our Commitment */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">私たちの約束</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">正確な情報</h3>
              <p className="text-sm text-gray-600">獣医師監修のもと、科学的根拠に基づいた情報を提供します</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">実体験ベース</h3>
              <p className="text-sm text-gray-600">10年以上の飼育経験から得た実践的なアドバイスをお届けします</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">継続的更新</h3>
              <p className="text-sm text-gray-600">最新の飼育情報を反映するため、定期的に記事を更新しています</p>
            </div>
          </div>
        </div>

        {/* Veterinary Advisor Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{veterinaryAdvisor.title}</h2>
                <p className="text-green-700 text-sm">獣医師による専門監修</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">{veterinaryAdvisor.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {veterinaryAdvisor.credentials.map((cred, i) => (
                <span key={i} className="inline-flex items-center text-sm bg-white border border-green-200 text-green-700 px-3 py-1 rounded-full">
                  {cred}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-500 italic">{veterinaryAdvisor.note}</p>
          </div>
        </div>

        {/* Editorial Team */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">編集部メンバー</h2>

          <div className="space-y-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                      <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        {member.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span>{member.experience}</span>
                      <span>飼育鳥: {member.birds}</span>
                    </div>

                    <p className="text-gray-700 mb-4">{member.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {member.credentials.map((cred, i) => (
                        <span key={i} className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {cred}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl p-8">
            <Mail className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">お問い合わせ</h2>
            <p className="text-gray-600 mb-6">
              小鳥に関するご質問、記事へのご要望、取材のご依頼など、
              お気軽にお問い合わせください。
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              お問い合わせはこちら
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
