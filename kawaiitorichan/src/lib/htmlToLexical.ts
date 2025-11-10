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

interface LinkNode {
  type: 'link'
  fields: {
    linkType: 'custom' | 'internal'
    url?: string
    doc?: {
      relationTo: string
      value: string | number
    }
    newTab?: boolean
  }
  children: TextNode[]
  direction?: 'ltr' | 'rtl' | null
  format?: string | number
  indent?: number
  version?: number
}

type InlineNode = TextNode | LinkNode

interface ParagraphNode {
  type: 'paragraph'
  format: string
  indent: number
  version: number
  children: InlineNode[]
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
  children: InlineNode[]
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
  children: InlineNode[]
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
  value: string | number
  format: string | number
  indent: number
  version: number
  fields?: {
    alt?: string
  }
}

interface TableCellNode {
  type: 'tablecell'
  version: number
  backgroundColor: string | null
  colSpan: number
  headerState: number
  rowSpan: number
  width: number | null
  children: ParagraphNode[]
}

interface TableRowNode {
  type: 'tablerow'
  version: number
  children: TableCellNode[]
}

interface TableNode {
  type: 'table'
  version: number
  children: TableRowNode[]
  direction: 'ltr' | 'rtl' | null
  format: string
  indent: number
}

type LexicalNode = ParagraphNode | HeadingNode | ListNode | QuoteNode | UploadNode | TableNode

/**
 * Create a text node with proper Payload format
 */
function createTextNode(text: string, format: number = 0): TextNode {
  return {
    mode: 'normal',
    text: text || '',
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
function createParagraphNode(children: InlineNode[]): ParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: children && children.length > 0 ? children : [createTextNode(' ')],
    direction: 'ltr',
    textStyle: '',
    textFormat: 0,
  }
}

/**
 * Create a link node
 */
function createLinkNode(url: string, text: string, format: number = 0): LinkNode {
  return {
    type: 'link',
    fields: {
      linkType: 'custom',
      url: url,
      newTab: url.startsWith('http') || url.startsWith('//'),
    },
    children: [createTextNode(text, format)],
    direction: 'ltr',
    format: 0,
    indent: 0,
    version: 1,
  }
}

/**
 * Extract text content and formatting from HTML element
 * Returns InlineNode objects (text nodes and link nodes)
 */
function extractTextWithFormatting(element: Element, currentFormat: number = 0): InlineNode[] {
  const nodes: InlineNode[] = []

  Array.from(element.childNodes).forEach((node: any) => {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent?.trim()
      if (text && text.length > 0) {
        nodes.push(createTextNode(text, currentFormat))
      }
    } else if (node.nodeType === 1) {
      // Element node
      const el = node as Element
      const tagName = el.tagName.toLowerCase()

      if (['strong', 'b'].includes(tagName)) {
        // Bold format - apply to text nodes
        const childNodes = extractTextWithFormatting(el, currentFormat | 1)
        nodes.push(...childNodes)
      } else if (['em', 'i'].includes(tagName)) {
        // Italic format
        const childNodes = extractTextWithFormatting(el, currentFormat | 2)
        nodes.push(...childNodes)
      } else if (tagName === 'u') {
        // Underline format
        const childNodes = extractTextWithFormatting(el, currentFormat | 4)
        nodes.push(...childNodes)
      } else if (tagName === 'a') {
        // Links: Create proper link nodes
        const text = el.textContent?.trim()
        const href = el.getAttribute('href')
        // Only create link nodes for valid URLs (not empty, not #, not javascript:)
        if (text && href && href.trim() !== '' && href !== '#' && !href.startsWith('javascript:')) {
          // Create a proper link node
          nodes.push(createLinkNode(href.trim(), text, currentFormat))
        } else if (text) {
          nodes.push(createTextNode(text, currentFormat))
        }
      } else {
        // Recursively process other elements
        const childNodes = extractTextWithFormatting(el, currentFormat)
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
      // Convert HTML table to proper Lexical table structure
      console.log('[TABLE DEBUG] Found table element in HTML')
      const tableRows: TableRowNode[] = []

      element.querySelectorAll('tr').forEach((tr: any) => {
        const tableCells: TableCellNode[] = []
        const cellElements = tr.querySelectorAll('td, th')

        cellElements.forEach((cell: any) => {
          const text = cell.textContent?.trim() || ''
          const isHeader = cell.tagName.toLowerCase() === 'th'

          // Create paragraph node with the cell's text content
          const cellParagraph = createParagraphNode([createTextNode(text)])

          // Create table cell node with proper structure
          tableCells.push({
            type: 'tablecell',
            version: 1,
            backgroundColor: null,
            colSpan: 1,
            headerState: isHeader ? 1 : 0,
            rowSpan: 1,
            width: null,
            children: [cellParagraph],
          })
        })

        if (tableCells.length > 0) {
          tableRows.push({
            type: 'tablerow',
            version: 1,
            children: tableCells,
          })
        }
      })

      if (tableRows.length > 0) {
        console.log(`[TABLE DEBUG] Created table with ${tableRows.length} rows`)
        children.push({
          type: 'table',
          version: 1,
          children: tableRows,
          direction: 'ltr',
          format: '',
          indent: 0,
        } as TableNode)
      } else {
        console.log('[TABLE DEBUG] No rows found in table, skipping')
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
          // Convert string ID to number if it's numeric
          const mediaValue = /^\d+$/.test(mediaId) ? parseInt(mediaId, 10) : mediaId
          children.push({
            type: 'upload',
            relationTo: 'media',
            value: mediaValue,
            format: '',
            indent: 0,
            version: 1,
            fields: {
              alt: alt
            }
          } as UploadNode)
        } else if (src.startsWith('http') || src.startsWith('data:')) {
          // For external URLs or data URIs, just skip for now
          // (they should have been processed by uploadImageToPayload)
          console.warn(`Skipping external/data URI image: ${src.substring(0, 100)}`)
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

  // Ensure we always have at least one paragraph with valid content
  if (children.length === 0) {
    children.push(createParagraphNode([createTextNode('Content imported from HTML')]))
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
