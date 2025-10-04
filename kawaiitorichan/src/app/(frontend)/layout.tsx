import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Noto_Sans_JP } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { StructuredData } from '@/components/StructuredData'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { GoogleSiteVerification } from '@/components/GoogleSiteVerification'
import { generateOrganizationSchema, generateWebSiteSchema } from '@/utilities/generateStructuredData'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import '../affiliate-link-styles.css'
import { getServerSideURL } from '@/utilities/getURL'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700', '900'],
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  // Generate site-wide structured data
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebSiteSchema()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable, notoSansJP.variable)} lang="ja" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon-navi.svg" rel="icon" type="image/svg+xml" />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* RSS Feed for blog syndication */}
        <link rel="alternate" type="application/rss+xml" title="Golf Knowledge Hub RSS Feed" href="/feed.xml" />
        {/* Google Search Console verification */}
        <GoogleSiteVerification />
        {/* Site-wide SEO: Organization and WebSite schemas */}
        <StructuredData data={[organizationSchema, websiteSchema]} />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          {/* Google Analytics 4 tracking */}
          <GoogleAnalytics />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: 'Golf Knowledge Hub - ゴルフの知識と技術',
  description: 'ゴルフの知識、技術、機器に関する総合情報サイト',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@golfknowledgehub',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#357A35',
}
