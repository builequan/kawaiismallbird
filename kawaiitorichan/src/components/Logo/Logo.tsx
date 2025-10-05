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
      className={clsx(
        'w-auto h-auto',
        'max-w-[180px] sm:max-w-[220px] md:max-w-[280px]',
        'max-h-[40px] sm:max-h-[50px] md:max-h-[60px]',
        'object-contain',
        className
      )}
      src="/kawaii-bird-logo.svg?v=1"
    />
  )
}
