'use client'

import React, { useState, useCallback } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { validateContactForm, normalizeInput, ContactFormData } from '@/lib/validators'

interface ContactFormProps {
  className?: string
}

export const ContactForm: React.FC<ContactFormProps> = ({ className = '' }) => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showRetry, setShowRetry] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ContactFormData>()

  const onSubmit = useCallback(
    async (data: ContactFormData) => {
      setIsSubmitting(true)
      setSubmitStatus('idle')
      setErrorMessage('')
      setShowRetry(false)

      try {
        // Normalize input data
        const normalizedData = {
          ...data,
          email: normalizeInput(data.email),
          phone: data.phone ? normalizeInput(data.phone) : undefined,
        }

        // Validate form data
        const validation = validateContactForm(normalizedData)
        if (!validation.isValid) {
          Object.entries(validation.errors).forEach(([field, message]) => {
            if (message) {
              setError(field as keyof ContactFormData, { message })
            }
          })
          setIsSubmitting(false)
          return
        }

        // Execute reCAPTCHA
        if (!executeRecaptcha) {
          throw new Error('reCAPTCHAが利用できません。ページを再読み込みしてください。')
        }

        const recaptchaToken = await executeRecaptcha('contact_form')
        if (!recaptchaToken) {
          throw new Error('reCAPTCHA検証に失敗しました。もう一度お試しください。')
        }

        // Submit form data
        const response = await fetch('/api/contact-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...normalizedData,
            recaptchaToken,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = result.retryAfter || 60
            throw new Error(
              `リクエストが多すぎます。${retryAfter}秒後にもう一度お試しください。`
            )
          }
          throw new Error(result.error || 'エラーが発生しました。もう一度お試しください。')
        }

        // Success
        setSubmitStatus('success')
        reset()
      } catch (error) {
        console.error('Form submission error:', error)
        setSubmitStatus('error')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'エラーが発生しました。もう一度お試しください。'
        )
        setShowRetry(true)
      } finally {
        setIsSubmitting(false)
      }
    },
    [executeRecaptcha, reset, setError]
  )

  const handleRetry = () => {
    setSubmitStatus('idle')
    setErrorMessage('')
    setShowRetry(false)
  }

  if (submitStatus === 'success') {
    return (
      <div className={`${className} text-center py-12`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 max-w-2xl mx-auto">
          <div className="text-green-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            送信完了しました
          </h3>
          <p className="text-gray-600">
            お問い合わせありがとうございます。<br />
            内容を確認の上、担当者よりご連絡させていただきます。
          </p>
          <button
            onClick={() => {
              setSubmitStatus('idle')
              reset()
            }}
            className="mt-6 text-green-600 hover:text-green-700 underline"
          >
            新しいお問い合わせを送信する
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name', {
              required: 'お名前は必須項目です',
              maxLength: {
                value: 50,
                message: 'お名前は50文字以内で入力してください',
              },
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="山田 太郎"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'メールアドレスは必須項目です',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '有効なメールアドレスを入力してください',
              },
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="example@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone', {
              pattern: {
                value: /^(\+81|0)[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{3,4}$/,
                message: '有効な電話番号を入力してください',
              },
            })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="090-1234-5678"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            {...register('message', {
              required: 'お問い合わせ内容は必須項目です',
              minLength: {
                value: 10,
                message: 'お問い合わせ内容は10文字以上で入力してください',
              },
              maxLength: {
                value: 2000,
                message: 'お問い合わせ内容は2000文字以内で入力してください',
              },
            })}
            rows={6}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="お問い合わせ内容をご記入ください"
            disabled={isSubmitting}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
          )}
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errorMessage}</p>
            {showRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 text-red-600 hover:text-red-700 underline text-sm"
              >
                もう一度試す
              </button>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3"
            variant="default"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                送信中...
              </span>
            ) : (
              '送信する'
            )}
          </Button>
        </div>

        {/* reCAPTCHA Notice */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>reCAPTCHA v3で保護されています</span>
          </div>
          <p className="text-xs text-gray-500">
            このサイトはreCAPTCHAによって保護されており、Googleの
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline mx-1"
            >
              プライバシーポリシー
            </a>
            と
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline mx-1"
            >
              利用規約
            </a>
            が適用されます。
          </p>
          <div className="flex justify-center">
            <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <img
                  src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                  alt="reCAPTCHA"
                  className="w-6 h-6"
                />
                <span className="font-medium">Protected by reCAPTCHA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}