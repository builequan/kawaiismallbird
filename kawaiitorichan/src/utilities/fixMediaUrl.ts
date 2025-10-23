/**
 * Fix media URLs to use Brave-compatible /files/ path
 */
export function fixMediaUrl(url: string | undefined | null): string {
  if (!url) return ''

  // Replace /api/media/file/ with /files/ (Brave-compatible)
  if (url.includes('/api/media/file/')) {
    return url.replace('/api/media/file/', '/files/')
  }

  // Replace /media/ with /files/ (Brave-compatible)
  if (url.includes('/media/')) {
    return url.replace('/media/', '/files/')
  }

  return url
}