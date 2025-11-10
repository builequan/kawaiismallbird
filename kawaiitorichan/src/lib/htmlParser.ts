import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'

export interface ParsedHTML {
  title: string
  content: string
}

export interface ExtractedImage {
  src: string
  alt?: string
  isBase64: boolean
  mimeType?: string
  data?: string
}

/**
 * Parse HTML and extract title and content
 * More intelligent extraction that handles various HTML structures
 */
export function parseHTML(htmlContent: string): ParsedHTML {
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document

  // Extract title
  let title = ''
  const titleTag = document.querySelector('title')
  const h1Tag = document.querySelector('h1')

  if (titleTag && titleTag.textContent) {
    title = titleTag.textContent.trim()
  } else if (h1Tag && h1Tag.textContent) {
    title = h1Tag.textContent.trim()
  }

  // Extract content - try multiple strategies
  let content = ''

  // Strategy 1: Look for common content container elements
  const bodyElement = document.querySelector('body')
  if (!bodyElement) {
    return { title, content: '' }
  }

  // First, clone the body to avoid modifying original
  const contentClone = bodyElement.cloneNode(true) as any

  // Remove script and style tags
  const scriptsAndStyles = contentClone.querySelectorAll('script, style, noscript')
  scriptsAndStyles.forEach((el: any) => el.remove())

  // Strategy 1: Find article/main/content divs
  let contentElement = contentClone.querySelector('article') ||
                       contentClone.querySelector('main') ||
                       contentClone.querySelector('[role="main"]') ||
                       contentClone.querySelector('.content') ||
                       contentClone.querySelector('.article-content') ||
                       contentClone.querySelector('.post-content') ||
                       contentClone.querySelector('.entry-content')

  // Strategy 2: If no container found, use body but exclude nav/header/footer/ads
  if (!contentElement) {
    contentElement = contentClone

    // Remove common non-content elements
    const unwantedSelectors = [
      'nav', 'header', 'footer', '[role="navigation"]',
      '.navbar', '.header', '.footer', '.sidebar', '.ads', '.ad-container',
      '.comments', '.comment-section', '[class*="sidebar"]'
    ]

    unwantedSelectors.forEach(selector => {
      contentElement.querySelectorAll(selector).forEach((el: any) => el.remove())
    })
  }

  // Extract content
  if (contentElement) {
    // Remove the first h1 if it matches the title (it's likely duplicate)
    const firstH1 = contentElement.querySelector('h1')
    if (firstH1 && firstH1.textContent?.trim() === title) {
      firstH1.remove()
    }

    // Get remaining content
    let contentHTML = contentElement.innerHTML.trim()

    // Only use if we got meaningful content
    if (contentHTML && contentHTML.length > 50) {
      content = contentHTML
    } else {
      // Fallback: use full body if we didn't extract enough
      content = bodyElement.innerHTML
    }
  } else {
    content = bodyElement.innerHTML
  }

  // Final cleanup: remove multiple consecutive newlines
  content = content.replace(/\n\s*\n/g, '\n')

  return {
    title,
    content,
  }
}

/**
 * Extract all images from HTML content
 */
export function extractImagesFromHTML(htmlContent: string): ExtractedImage[] {
  const dom = new JSDOM(htmlContent)
  const document = dom.window.document
  const images: ExtractedImage[] = []

  // Find all img tags
  const imgTags = document.querySelectorAll('img')

  imgTags.forEach(img => {
    const src = img.getAttribute('src')
    if (!src) return

    const alt = img.getAttribute('alt') || ''

    // Check if it's a base64 image
    const base64Match = src.match(/^data:image\/(.*?);base64,(.*)$/)

    if (base64Match) {
      images.push({
        src,
        alt,
        isBase64: true,
        mimeType: base64Match[1],
        data: base64Match[2],
      })
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      // External image URL
      images.push({
        src,
        alt,
        isBase64: false,
      })
    } else {
      // Relative path image
      images.push({
        src,
        alt,
        isBase64: false,
      })
    }
  })

  return images
}

/**
 * Upload image to Payload media collection
 */
export async function uploadImageToPayload(
  payload: Payload,
  image: ExtractedImage,
): Promise<any> {
  let fileBuffer: Buffer
  let filename: string
  let mimeType: string

  if (image.isBase64 && image.data) {
    // Convert base64 to buffer
    fileBuffer = Buffer.from(image.data, 'base64')
    filename = `uploaded-${Date.now()}.${image.mimeType}`
    mimeType = `image/${image.mimeType}`
  } else {
    // Download external image
    const response = await fetch(image.src)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${image.src}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    fileBuffer = Buffer.from(arrayBuffer)

    // Extract filename from URL
    const urlParts = image.src.split('/')
    filename = urlParts[urlParts.length - 1] || `downloaded-${Date.now()}.jpg`

    // Get mime type from response
    mimeType = response.headers.get('content-type') || 'image/jpeg'
  }

  // Create a file object in the format Payload expects on server side
  const file = {
    data: fileBuffer,
    mimetype: mimeType,
    name: filename,
    size: fileBuffer.length,
  }

  // Upload to Payload media collection
  // Ensure alt text is not empty and meets validation requirements
  const altText = (image.alt && image.alt.trim()) || `Image from HTML import ${Date.now()}`

  const mediaDoc = await payload.create({
    collection: 'media',
    data: {
      alt: altText,
    },
    file,
  })

  return mediaDoc
}

/**
 * Convert HTML node to Lexical children
 */
function htmlNodeToLexical(node: any): any[] {
  const children: any[] = []

  if (node.nodeType === 3) {
    // Text node
    const text = node.textContent?.trim()
    if (text && text.length > 0) {
      return [
        {
          type: 'text',
          text: text,
        },
      ]
    }
    return []
  }

  if (node.nodeType !== 1) {
    return []
  }

  const element = node as Element
  const tagName = element.tagName.toLowerCase()

  // Handle inline elements
  if (['strong', 'b'].includes(tagName)) {
    return Array.from(node.childNodes)
      .flatMap((child: any) => {
        const content = htmlNodeToLexical(child)
        return content.map((c: any) => (c.type === 'text' ? { ...c, bold: true } : c))
      })
  }

  if (['em', 'i'].includes(tagName)) {
    return Array.from(node.childNodes)
      .flatMap((child: any) => {
        const content = htmlNodeToLexical(child)
        return content.map((c: any) => (c.type === 'text' ? { ...c, italic: true } : c))
      })
  }

  if (['u'].includes(tagName)) {
    return Array.from(node.childNodes)
      .flatMap((child: any) => {
        const content = htmlNodeToLexical(child)
        return content.map((c: any) => (c.type === 'text' ? { ...c, underline: true } : c))
      })
  }

  if (['s', 'strike'].includes(tagName)) {
    return Array.from(node.childNodes)
      .flatMap((child: any) => {
        const content = htmlNodeToLexical(child)
        return content.map((c: any) => (c.type === 'text' ? { ...c, strikethrough: true } : c))
      })
  }

  if (tagName === 'a') {
    const href = element.getAttribute('href') || ''
    const textContent = element.textContent || 'Link'
    return [
      {
        type: 'link',
        url: href,
        children: [
          {
            type: 'text',
            text: textContent,
          },
        ],
      },
    ]
  }

  // Default: return text content
  return [
    {
      type: 'text',
      text: element.textContent || '',
    },
  ]
}

/**
 * Convert HTML to Lexical editor format
 */
export function convertHTMLToLexical(htmlContent: string): any {
  // Wrap content in a div if it doesn't have proper HTML structure
  let content = htmlContent
  if (!htmlContent.includes('<body')) {
    content = `<html><body>${htmlContent}</body></html>`
  }

  const dom = new JSDOM(content)
  const document = dom.window.document
  let bodyElement = document.querySelector('body')

  // If still no body, try to get root element
  if (!bodyElement) {
    bodyElement = document.documentElement
  }

  if (!bodyElement) {
    return {
      root: {
        type: 'root',
        children: [],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    }
  }

  const children: any[] = []

  // Process each child element
  Array.from(bodyElement.childNodes).forEach((node: any) => {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        children.push({
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text,
            },
          ],
        })
      }
      return
    }

    if (node.nodeType !== 1) {
      return
    }

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'p') {
      const paraChildren: any[] = []
      Array.from(element.childNodes).forEach((child: any) => {
        paraChildren.push(...htmlNodeToLexical(child))
      })
      if (paraChildren.length > 0) {
        children.push({
          type: 'paragraph',
          children: paraChildren,
        })
      }
    } else if (tagName.match(/^h[1-6]$/)) {
      const paraChildren: any[] = []
      Array.from(element.childNodes).forEach((child: any) => {
        paraChildren.push(...htmlNodeToLexical(child))
      })
      if (paraChildren.length > 0) {
        children.push({
          type: 'heading',
          tag: tagName,
          children: paraChildren,
        })
      }
    } else if (tagName === 'blockquote') {
      const paraChildren: any[] = []
      Array.from(element.childNodes).forEach((child: any) => {
        if (child.nodeType === 1 && child.tagName.toLowerCase() === 'p') {
          const pChildren: any[] = []
          Array.from(child.childNodes).forEach((pChild: any) => {
            pChildren.push(...htmlNodeToLexical(pChild))
          })
          if (pChildren.length > 0) {
            paraChildren.push({
              type: 'paragraph',
              children: pChildren,
            })
          }
        } else {
          paraChildren.push(...htmlNodeToLexical(child))
        }
      })
      if (paraChildren.length > 0) {
        children.push({
          type: 'quote',
          children: paraChildren,
        })
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const listItems: any[] = []
      element.querySelectorAll(':scope > li').forEach((li: any) => {
        const liChildren: any[] = []
        Array.from(li.childNodes).forEach((child: any) => {
          liChildren.push(...htmlNodeToLexical(child))
        })
        if (liChildren.length > 0) {
          listItems.push({
            type: 'listitem',
            children: liChildren,
          })
        }
      })
      if (listItems.length > 0) {
        children.push({
          type: 'list',
          listType: tagName === 'ul' ? 'bullet' : 'number',
          children: listItems,
        })
      }
    } else if (tagName === 'table') {
      const tableHTML = element.outerHTML
      children.push({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: '[Table content - HTML not fully supported in editor yet]',
          },
        ],
      })
      // Store table HTML in a comment or metadata
      console.warn('Table element found but not fully converted to Lexical format')
    } else if (tagName === 'img') {
      const src = element.getAttribute('src')
      const alt = element.getAttribute('alt')
      if (src) {
        // Check if this is a media ID marker
        const mediaIdMatch = src.match(/__MEDIA_ID_(.+?)__/)
        if (mediaIdMatch) {
          const mediaId = mediaIdMatch[1]
          children.push({
            type: 'upload',
            relationTo: 'media',
            value: mediaId,
            alt: alt || '',
          })
        } else {
          // Keep the image reference as-is
          children.push({
            type: 'upload',
            relationTo: 'media',
            value: src,
            alt: alt || '',
          })
        }
      }
    } else if (tagName === 'br') {
      // Skip br tags, they don't make sense in Lexical
    } else {
      // For other block elements, try to parse as paragraph
      const paraChildren: any[] = []
      Array.from(element.childNodes).forEach((child: any) => {
        paraChildren.push(...htmlNodeToLexical(child))
      })
      if (paraChildren.length > 0) {
        children.push({
          type: 'paragraph',
          children: paraChildren,
        })
      }
    }
  })

  return {
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
