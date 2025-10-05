'use client'

import React, { useState } from 'react'
import { CommentList } from '@/components/CommentList'
import { CommentForm } from '@/components/CommentForm'

interface CommentSectionProps {
  postId: string
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCommentSubmitted = () => {
    // Refresh the comment list (though new comments won't show until approved)
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="mt-12 border-t pt-8">
      <CommentList postId={postId} refreshTrigger={refreshTrigger} />
      <CommentForm postId={postId} onCommentSubmitted={handleCommentSubmitted} />
    </div>
  )
}
