/**
 * Fix media URLs from incorrect /api/media/file/ to correct /media/ path
 */
export function fixMediaUrl(url: string | undefined | null): string {
  if (!url) return ''

  // Replace /api/media/file/ with /media/
  if (url.includes('/api/media/file/')) {
    return url.replace('/api/media/file/', '/media/')
  }

  return url
}