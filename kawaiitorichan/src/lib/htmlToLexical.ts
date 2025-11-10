import { JSDOM } from 'jsdom'

/**
 * Payload Lexical format uses specific field names and structure
 * This converter creates the proper format expected by Payload CMS
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
}

interface HeadingNode {
  type: 'heading'
  tag: string
  format: string
  indent: number
  version: number
  children: TextNode[]
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

type LexicalNode = ParagraphNode | HeadingNode | ListNode | QuoteNode

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
  }
}

/**
 * Extract text content and formatting from HTML element
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
        // Format 1 = bold
        const text = el.textContent?.trim()
        if (text) {
          nodes.push(createTextNode(text, 1))
        }
      } else if (['em', 'i'].includes(tagName)) {
        // Format 2 = italic
        const text = el.textContent?.trim()
        if (text) {
          nodes.push(createTextNode(text, 2))
        }
      } else if (tagName === 'u') {
        // Format 4 = underline
        const text = el.textContent?.trim()
        if (text) {
          nodes.push(createTextNode(text, 4))
        }
      } else if (tagName === 'a') {
        // Links are complex - for now just extract text
        const text = el.textContent?.trim()
        if (text) {
          nodes.push(createTextNode(text))
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
      // Extract table text content
      const tableText = element.textContent?.trim()
      if (tableText) {
        children.push(createParagraphNode([createTextNode('[Table: ' + tableText.substring(0, 100) + '...]')]))
      }
    } else if (tagName === 'img') {
      // Skip images for now
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
