'use client'

import React from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

interface RecaptchaProviderProps {
  children: React.ReactNode
}

export const RecaptchaProvider: React.FC<RecaptchaProviderProps> = ({ children }) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    console.warn('reCAPTCHA site key is not configured. Contact form will work without CAPTCHA protection.')
    return <>{children}</>
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      language="ja"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'body',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}