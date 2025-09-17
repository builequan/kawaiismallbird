'use client'

import { useEffect } from 'react'

export function HideRecaptchaBadge() {
  useEffect(() => {
    // Add CSS to hide reCAPTCHA badge
    const style = document.createElement('style')
    style.textContent = `
      .grecaptcha-badge {
        visibility: hidden !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return null
}