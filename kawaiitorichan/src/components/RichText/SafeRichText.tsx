'use client'

import React from 'react'
import RichText from './index'

type Props = {
  data: any
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RichText rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default function SafeRichText({ data, ...props }: Props) {
  // Check if data exists and has the expected structure
  if (!data || typeof data !== 'object') {
    return (
      <div className="prose max-w-none mx-auto p-4">
        <p className="text-gray-500">Content is being processed...</p>
      </div>
    )
  }

  // Don't try to handle simple text structure - let the RichText component handle it
  // This was causing the issue where only the first paragraph was shown

  // Try to render with the actual RichText component
  return (
    <ErrorBoundary
      fallback={
        <div className="prose max-w-none mx-auto p-4">
          <p className="text-gray-500">
            Unable to display content. Please check the content format.
          </p>
        </div>
      }
    >
      <RichText data={data} {...props} />
    </ErrorBoundary>
  )
}