'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Google Analytics 4 component
 * Tracks page views and custom events
 */
export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views when route changes
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // Send pageview with custom parameters
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }, [pathname, searchParams])

  // Don't load GA in development or if ID is not set
  if (process.env.NODE_ENV === 'development' || !GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              anonymize_ip: true,
            });
          `,
        }}
      />
    </>
  )
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
  }
}

/**
 * Track custom events
 * Usage: trackEvent('button_click', { button_name: 'subscribe' })
 */
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return

  window.gtag?.('event', eventName, parameters)
}

/**
 * Track internal link clicks
 */
export function trackInternalLinkClick(linkText: string, linkUrl: string) {
  trackEvent('internal_link_click', {
    link_text: linkText,
    link_url: linkUrl,
  })
}

/**
 * Track affiliate link clicks
 */
export function trackAffiliateLinkClick(productName: string, productUrl: string) {
  trackEvent('affiliate_click', {
    product_name: productName,
    product_url: productUrl,
    value: 1, // Can be used for conversion tracking
  })
}

/**
 * Track search queries
 */
export function trackSearch(searchTerm: string, resultsCount: number) {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  })
}

/**
 * Track time on page (engagement)
 */
export function trackEngagement(pagePath: string, timeInSeconds: number) {
  trackEvent('user_engagement', {
    page_path: pagePath,
    engagement_time_msec: timeInSeconds * 1000,
  })
}
