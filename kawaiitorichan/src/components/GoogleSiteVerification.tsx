/**
 * Google Search Console Verification Component
 * Adds the verification meta tag to the <head>
 */

const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

export function GoogleSiteVerification() {
  // Don't render if verification code is not set
  if (!GOOGLE_SITE_VERIFICATION) {
    return null
  }

  return (
    <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
  )
}
