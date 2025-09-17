'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

const PageClient: React.FC = () => {
  /* Don't force dark mode since we have light green background */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme(null) // Use default theme
  }, [setHeaderTheme])
  return <React.Fragment />
}

export default PageClient
