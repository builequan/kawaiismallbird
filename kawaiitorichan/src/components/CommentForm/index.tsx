'use client'

import React, { useState } from 'react'

interface CommentFormProps {
  postId: string
  onCommentSubmitted?: () => void
}

export const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentSubmitted }) => {
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          authorName,
          content,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setAuthorName('')
        setContent('')
        if (onCommentSubmitted) {
          onCommentSubmitted()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'コメントの送信に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'コメントの送信に失敗しました' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-2xl font-bold mb-4" style={{ color: '#212121' }}>
        コメントを残す
      </h3>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="authorName" className="block mb-2 font-medium" style={{ color: '#212121' }}>
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="お名前を入力してください"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 font-medium" style={{ color: '#212121' }}>
            コメント <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={1000}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="コメントを入力してください（1000文字まで）"
            disabled={isSubmitting}
          />
          <div className="text-sm text-gray-500 mt-1">
            {content.length} / 1000
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#357A35' }}
        >
          {isSubmitting ? '送信中...' : 'コメントを送信'}
        </button>
      </form>

      <p className="mt-4 text-sm" style={{ color: '#404040' }}>
        ※ コメントは承認後に表示されます
      </p>
    </div>
  )
}
