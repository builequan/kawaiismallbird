import { getClientSideURL } from '@/utilities/getURL'
import type { Media } from '@/payload-types'

/**
 * Processes media resource URL to ensure proper formatting
 * @param resource The media resource (string URL or Media object)
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (resource: string | Media | null | undefined, cacheTag?: string | null): string => {
  if (!resource) return ''

  // If it's a Media object, extract the URL
  let url: string = ''
  if (typeof resource === 'object' && 'url' in resource) {
    url = resource.url || ''
  } else if (typeof resource === 'string') {
    url = resource
  }

  if (!url) return ''

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise prepend client-side URL
  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
