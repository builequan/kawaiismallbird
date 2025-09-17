import React from 'react'
import { Metadata } from 'next'
import { ContactForm } from '@/components/ContactForm'
import { RecaptchaProvider } from '@/components/ContactForm/RecaptchaProvider'
import { HideRecaptchaBadge } from '@/components/ContactForm/HideRecaptchaBadge'

export const metadata: Metadata = {
  title: 'お問い合わせ | Golf Website',
  description: 'お気軽にお問い合わせください。ゴルフに関するご質問、ご相談を承っております。',
}

export default function ContactPage() {
  return (
    <RecaptchaProvider>
      <HideRecaptchaBadge />
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              お問い合わせ
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              ゴルフに関するご質問、ご相談など、お気軽にお問い合わせください
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                お問い合わせフォーム
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                下記フォームに必要事項をご入力の上、送信ボタンをクリックしてください。
                内容を確認の上、担当者より折り返しご連絡させていただきます。
                通常、1-2営業日以内にご返信いたします。
              </p>

              {/* Info Cards */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-600 mt-1 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">
                        営業時間
                      </h3>
                      <p className="text-sm text-green-700">
                        平日 9:00 - 18:00<br />
                        土日祝日 休業
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        返信について
                      </h3>
                      <p className="text-sm text-blue-700">
                        通常1-2営業日以内<br />
                        お急ぎの場合はお電話ください
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <ContactForm />
            </div>

            {/* FAQ Section */}
            <div className="mt-12 bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                よくあるご質問
              </h2>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Q: 個人情報の取り扱いについて
                  </h3>
                  <p className="text-gray-600 text-sm">
                    A: お客様からお預かりした個人情報は、お問い合わせへの回答にのみ使用し、
                    適切に管理いたします。第三者への提供は一切行いません。
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Q: 返信が来ない場合
                  </h3>
                  <p className="text-gray-600 text-sm">
                    A: 迷惑メールフォルダをご確認ください。また、メールアドレスが正しく入力されているか
                    ご確認の上、再度お問い合わせください。
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Q: 電話でのお問い合わせ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    A: お急ぎの場合は、営業時間内（平日9:00-18:00）にお電話でもお問い合わせを
                    承っております。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RecaptchaProvider>
  )
}