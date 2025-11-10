import { JSDOM } from 'jsdom'

/**
 * Payload Lexical format uses specific field names and structure
 * This converter creates the proper format expected by Payload CMS
 * Focus on core structures that Payload definitely supports
 */

interface TextNode {
  mode: 'normal'
  text: string
  type: 'text'
  style: string
  detail: number
  format: number
  version: number
}

interface ParagraphNode {
  type: 'paragraph'
  format: string
  indent: number
  version: number
  children: TextNode[]
  direction?: 'ltr' | 'rtl' | null
  textStyle?: string
  textFormat?: number
}

interface HeadingNode {
  type: 'heading'
  tag: string
  format: string
  indent: number
  version: number
  children: TextNode[]
  direction?: 'ltr' | 'rtl' | null
}

interface ListNode {
  type: 'list'
  listType: 'bullet' | 'number'
  start: number
  format: string
  indent: number
  version: number
  children: ListItemNode[]
}

interface ListItemNode {
  type: 'listitem'
  value: number
  format: string
  indent: number
  version: number
  children: TextNode[]
}

interface QuoteNode {
  type: 'quote'
  format: string
  indent: number
  version: number
  children: ParagraphNode[]
}

interface UploadNode {
  type: 'upload'
  relationTo: 'media'
  value: string
  alt: string
}

type LexicalNode = ParagraphNode | HeadingNode | ListNode | QuoteNode | UploadNode

/**
 * Create a text node with proper Payload format
 */
function createTextNode(text: string, format: number = 0): TextNode {
  return {
    mode: 'normal',
    text: text,
    type: 'text',
    style: '',
    detail: 0,
    format: format,
    version: 1,
  }
}

/**
 * Create a paragraph node
 */
function createParagraphNode(children: TextNode[]): ParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: children.length > 0 ? children : [createTextNode('')],
    direction: 'ltr',
    textStyle: '',
    textFormat: 0,
  }
}

/**
 * Extract text content and formatting from HTML element
 * NOTE: Links are extracted as text only (Payload's link support requires special fields)
 */
function extractTextWithFormatting(element: Element): TextNode[] {
  const nodes: TextNode[] = []

  Array.from(element.childNodes).forEach((node: any) => {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        nodes.push(createTextNode(text))
      }
    } else if (node.nodeType === 1) {
      // Element node
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      if (['strong', 'b'].includes(tagName)) {
        // Bold format - apply to text nodes
        const childNodes = extractTextWithFormatting(el)
        childNodes.forEach(child => {
          nodes.push(createTextNode(child.text, child.format | 1))
        })
      } else if (['em', 'i'].includes(tagName)) {
        // Italic format
        const childNodes = extractTextWithFormatting(el)
        childNodes.forEach(child => {
          nodes.push(createTextNode(child.text, child.format | 2))
        })
      } else if (tagName === 'u') {
        // Underline format
        const childNodes = extractTextWithFormatting(el)
        childNodes.forEach(child => {
          nodes.push(createTextNode(child.text, child.format | 4))
        })
      } else if (tagName === 'a') {
        // Links: Extract text with optional href as text annotation
        // Payload's link support requires internal doc references which we don't have here
        const text = el.textContent?.trim()
        const href = el.getAttribute('href')
        if (text) {
          // Include href in the text as notation for now
          if (href && href !== '#') {
            nodes.push(createTextNode(`${text} (${href})`))
          } else {
            nodes.push(createTextNode(text))
          }
        }
      } else {
        // Recursively process other elements
        const childNodes = extractTextWithFormatting(el)
        nodes.push(...childNodes)
      }
    }
  })

  return nodes
}

/**
 * Convert HTML to Payload Lexical format
 * Focuses on structures that Payload CMS definitely supports
 */
export function convertHTMLToPayloadLexical(htmlContent: string): any {
  // Wrap content if needed
  let html = htmlContent
  if (!html.includes('<body') && !html.includes('<!DOCTYPE')) {
    html = `<html><body>${htmlContent}</body></html>`
  }

  const dom = new JSDOM(html)
  const document = dom.window.document
  const bodyElement = document.querySelector('body')

  if (!bodyElement) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          createParagraphNode([createTextNode('Empty content')])
        ],
      },
    }
  }

  const children: LexicalNode[] = []

  // Process each child element
  Array.from(bodyElement.childNodes).forEach((node: any) => {
    if (node.nodeType === 3) {
      // Text node - skip pure whitespace
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        children.push(createParagraphNode([createTextNode(text)]))
      }
      return
    }

    if (node.nodeType !== 1) return

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'p') {
      const textNodes = extractTextWithFormatting(element)
      if (textNodes.length > 0) {
        children.push(createParagraphNode(textNodes))
      }
    } else if (tagName.match(/^h[1-6]$/)) {
      const textNodes = extractTextWithFormatting(element)
      if (textNodes.length > 0) {
        children.push({
          type: 'heading',
          tag: tagName,
          format: '',
          indent: 0,
          version: 1,
          children: textNodes,
          direction: 'ltr',
        } as HeadingNode)
      }
    } else if (tagName === 'blockquote') {
      const quoteChildren: ParagraphNode[] = []
      Array.from(element.childNodes).forEach((child: any) => {
        if (child.nodeType === 1 && child.tagName.toLowerCase() === 'p') {
          const textNodes = extractTextWithFormatting(child)
          quoteChildren.push(createParagraphNode(textNodes))
        } else if (child.nodeType === 3) {
          const text = child.textContent?.trim()
          if (text && text.length > 0) {
            quoteChildren.push(createParagraphNode([createTextNode(text)]))
          }
        }
      })
      if (quoteChildren.length > 0) {
        children.push({
          type: 'quote',
          format: '',
          indent: 0,
          version: 1,
          children: quoteChildren,
        } as QuoteNode)
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const listItems: ListItemNode[] = []
      let itemIndex = 1

      element.querySelectorAll(':scope > li').forEach((li: any) => {
        const textNodes = extractTextWithFormatting(li)
        if (textNodes.length > 0) {
          listItems.push({
            type: 'listitem',
            value: itemIndex,
            format: '',
            indent: 0,
            version: 1,
            children: textNodes,
          })
          itemIndex++
        }
      })

      if (listItems.length > 0) {
        children.push({
          type: 'list',
          listType: tagName === 'ul' ? 'bullet' : 'number',
          start: 1,
          format: '',
          indent: 0,
          version: 1,
          children: listItems,
        } as ListNode)
      }
    } else if (tagName === 'table') {
      // Convert table to formatted text with line breaks
      // Tables in plain Lexical are complex - simplify to readable text format
      const rows: string[] = []
      element.querySelectorAll('tr').forEach((tr: any) => {
        const cells: string[] = []
        tr.querySelectorAll('td, th').forEach((cell: any) => {
          cells.push(cell.textContent?.trim() || '')
        })
        rows.push(cells.join(' | '))
      })
      if (rows.length > 0) {
        rows.forEach(row => {
          children.push(createParagraphNode([createTextNode(row)]))
        })
      }
    } else if (tagName === 'img') {
      // Handle images with media ID markers
      const src = element.getAttribute('src')
      const alt = element.getAttribute('alt') || 'Image'

      if (src) {
        // Check for __MEDIA_ID_ marker (indicates image was uploaded)
        const mediaIdMatch = src.match(/__MEDIA_ID_([^_]+)__/)
        if (mediaIdMatch) {
          const mediaId = mediaIdMatch[1]
          children.push({
            type: 'upload',
            relationTo: 'media',
            value: mediaId,
            alt: alt
          } as UploadNode)
        } else if (src.startsWith('http')) {
          // External image URL
          children.push({
            type: 'upload',
            relationTo: 'media',
            value: src,
            alt: alt
          } as UploadNode)
        }
      }
    } else if (tagName === 'br') {
      // Skip br tags
    } else {
      // Try to process as paragraph
      const textNodes = extractTextWithFormatting(element)
      if (textNodes.length > 0) {
        children.push(createParagraphNode(textNodes))
      }
    }
  })

  // Ensure we always have at least one paragraph
  if (children.length === 0) {
    children.push(createParagraphNode([createTextNode('No content')]))
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: children,
    },
  }
}
