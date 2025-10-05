'use client'

import React, { useEffect, useState } from 'react'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

interface CommentListProps {
  postId: string
  refreshTrigger?: number
}

export const CommentList: React.FC<CommentListProps> = ({ postId, refreshTrigger = 0 }) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/comments?postId=${postId}`)
        const data = await response.json()

        if (response.ok) {
          setComments(data.comments)
        } else {
          setError(data.error || 'コメントの読み込みに失敗しました')
        }
      } catch (err) {
        setError('コメントの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [postId, refreshTrigger])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <p style={{ color: '#404040' }}>コメントを読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#212121' }}>
          コメント
        </h3>
        <p style={{ color: '#404040' }}>まだコメントはありません。最初のコメントを投稿してください！</p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6" style={{ color: '#212121' }}>
        コメント ({comments.length})
      </h3>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-6 rounded-lg border"
            style={{ backgroundColor: '#f9f9f9', borderColor: '#e0e0e0' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold" style={{ color: '#212121' }}>
                {comment.authorName}
              </div>
              <div className="text-sm" style={{ color: '#404040' }}>
                {formatDate(comment.createdAt)}
              </div>
            </div>
            <p style={{ color: '#212121', whiteSpace: 'pre-wrap' }}>
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
