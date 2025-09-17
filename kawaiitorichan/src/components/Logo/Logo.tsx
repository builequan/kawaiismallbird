import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Kawaii Bird Logo"
      width={280}
      height={80}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[280px] w-full h-auto', className)}
      src="/kawaii-bird-logo.svg?v=1"
    />
  )
}
