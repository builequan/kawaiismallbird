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
  // Always use NEXT_PUBLIC_SERVER_URL if available for consistency
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL
  }

  // CRITICAL FIX: When running in browser, use the current window location
  // This ensures we always use the actual domain, not localhost
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    // Always return the current browser URL (where the user is visiting from)
    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  // For server-side rendering, try to use the actual server URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  // Last resort fallback - but this should rarely be reached
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}
