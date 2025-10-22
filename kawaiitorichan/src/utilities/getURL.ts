import canUseDOM from './canUseDOM'

export const getServerSideURL = () => {
  let url = process.env.NEXT_PUBLIC_SERVER_URL

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (!url) {
    const port = process.env.PORT || '3000'
    url = `http://localhost:${port}`
  }

  return url
}

export const getClientSideURL = () => {
  // PRODUCTION FIX: In production, always use production URL
  // This prevents localhost URLs during server-side rendering in Docker builds
  if (process.env.NODE_ENV === 'production') {
    // First try NEXT_PUBLIC_SERVER_URL
    if (process.env.NEXT_PUBLIC_SERVER_URL) {
      return process.env.NEXT_PUBLIC_SERVER_URL
    }
    // Fallback to hardcoded production URL for kawaiitorichan.com
    return 'https://kawaiitorichan.com'
  }

  // Development: use NEXT_PUBLIC_SERVER_URL if available
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL
  }

  // Browser: use the current window location
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port
    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  // Vercel deployment
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Local development fallback
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}
