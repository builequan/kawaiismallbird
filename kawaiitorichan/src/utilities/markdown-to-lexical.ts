import matter from 'gray-matter'
import { marked } from 'marked'

interface MarkdownMeta {
  title?: string
  slug?: string
  author?: string
  date?: string
  modified?: string
  status?: string
  type?: string
  categories?: string[]
  tags?: string[]
  featured_image?: string
  featured_image_alt?: string
  excerpt?: string
  meta_description?: string
  meta_keywords?: string
  focus_keyphrase?: string
  enable_comments?: boolean
  enable_toc?: boolean
}

interface ConvertedContent {
  metadata: MarkdownMeta
  lexicalContent: any
  plainContent: string
  images: string[]
  mermaidDiagrams: Array<{
    code: string
    title?: string
  }>
  codeBlocks: Array<{
    code: string
    language: string
  }>
}

export async function convertMarkdownToLexical(markdownContent: string, removeDuplicates: boolean = true): Promise<ConvertedContent> {
  // Parse front matter
  const { data: metadata, content } = matter(markdownContent)
  
  // Remove the first H1 heading if it matches or is similar to the title in metadata
  let processedContent = content
  if (removeDuplicates && metadata.title) {
    // Try multiple patterns to remove duplicate titles
    // 1. Exact match with # prefix
    const exactH1Regex = new RegExp(`^#\\s+${metadata.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'im')
    processedContent = processedContent.replace(exactH1Regex, '')
    
    // 2. Check for title at the very beginning without # (sometimes markdown exports have plain text titles)
    const plainTitleRegex = new RegExp(`^${metadata.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'im')
    processedContent = processedContent.replace(plainTitleRegex, '')
    
    // 3. Also check for any H1 in the first few lines that matches the title
    const lines = processedContent.split('\n')
    const firstFewLines = lines.slice(0, 5)
    for (let i = 0; i < firstFewLines.length; i++) {
      const line = firstFewLines[i].trim()
      // Check if this line is an H1 heading
      if (line.startsWith('#') && !line.startsWith('##')) {
        const headingText = line.replace(/^#\s*/, '').trim()
        // Check if it matches the title (case-insensitive, allowing some variations)
        const normalizedTitle = metadata.title.toLowerCase().trim()
        const normalizedHeading = headingText.toLowerCase().trim()
        if (normalizedHeading === normalizedTitle || 
            normalizedHeading.includes(normalizedTitle) ||
            normalizedTitle.includes(normalizedHeading)) {
          lines.splice(i, 1)
          processedContent = lines.join('\n')
          break
        }
      }
    }
  }
  
  // Remove the first image if it matches the featured image to prevent duplicates
  if (removeDuplicates && metadata.featured_image) {
    // Look for the featured image in the content and remove it if it's at the beginning
    const featuredImageName = metadata.featured_image.split('/').pop() || metadata.featured_image
    // Escape special regex characters in the filename
    const escapedImageName = featuredImageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Also create a version without extension
    const nameWithoutExt = escapedImageName.replace(/\\\.\w+$/, '')
    
    const imagePatterns = [
      // Standard markdown image syntax with exact filename
      new RegExp(`!\\[[^\\]]*\\]\\([^)]*${escapedImageName}[^)]*\\)\\s*\\n?`, 'i'),
      // Image might be referenced without extension
      new RegExp(`!\\[[^\\]]*\\]\\([^)]*${nameWithoutExt}[^)]*\\)\\s*\\n?`, 'i'),
    ]
    
    // Check first few lines for the featured image
    const lines = processedContent.split('\n')
    const firstImageLineIndex = lines.findIndex(line => {
      for (const pattern of imagePatterns) {
        if (pattern.test(line)) {
          return true
        }
      }
      return false
    })
    
    // Remove the first occurrence of the featured image if it's in the first 10 lines
    if (firstImageLineIndex >= 0 && firstImageLineIndex < 10) {
      lines.splice(firstImageLineIndex, 1)
      processedContent = lines.join('\n')
    }
  }
  
  // Extract all images
  const images: string[] = []
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match
  while ((match = imageRegex.exec(processedContent)) !== null) {
    images.push(match[2])
  }
  
  // Extract mermaid diagrams as code blocks
  const mermaidDiagrams: Array<{ code: string; title?: string }> = []
  const mermaidRegex = /```(?:mermaid|Mermaid|MERMAID)\n([\s\S]*?)```/g
  let contentWithPlaceholders = processedContent
  let mermaidIndex = 0
  
  while ((match = mermaidRegex.exec(processedContent)) !== null) {
    const code = match[1].trim()
    mermaidDiagrams.push({ code, title: `Diagram ${mermaidIndex + 1}` })
    mermaidIndex++
  }
  
  // Replace mermaid blocks with placeholders
  contentWithPlaceholders = processedContent.replace(
    /```(?:mermaid|Mermaid|MERMAID)\n[\s\S]*?```/g,
    '___MERMAID_PLACEHOLDER___'
  )
  
  // Extract other code blocks
  const codeBlocks: Array<{ code: string; language: string }> = []
  const codeRegex = /```(\w*)\n([\s\S]*?)```/g
  let codeIndex = 0
  
  while ((match = codeRegex.exec(contentWithPlaceholders)) !== null) {
    const language = match[1] || 'plaintext'
    const code = match[2].trim()
    if (language.toLowerCase() !== 'mermaid') {
      codeBlocks.push({ code, language })
      codeIndex++
    }
  }
  
  // Replace code blocks with placeholders
  contentWithPlaceholders = contentWithPlaceholders.replace(
    /```\w*\n[\s\S]*?```/g,
    '___CODE_PLACEHOLDER___'
  )
  
  // Parse the markdown content into structured nodes
  const lexicalContent = await parseMarkdownToLexical(
    contentWithPlaceholders,
    images,
    mermaidDiagrams,
    codeBlocks
  )
  
  // Get plain text content
  const plainContent = processedContent
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/[#*`\[\]()!]/g, '') // Remove markdown syntax
    .trim()
  
  return {
    metadata: metadata as MarkdownMeta,
    lexicalContent,
    plainContent,
    images,
    mermaidDiagrams,
    codeBlocks,
  }
}

async function parseMarkdownToLexical(
  content: string,
  images: string[],
  mermaidDiagrams: Array<{ code: string; title?: string }>,
  codeBlocks: Array<{ code: string; language: string }>
): Promise<any> {
  const nodes: any[] = []
  let mermaidIndex = 0
  let codeIndex = 0
  const imageIndex = 0
  
  // Split content into lines for processing
  const lines = content.split('\n')
  let currentParagraph: string[] = []
  let tableLines: string[] = []
  let inTable = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this line looks like a table row
    const isTableRow = line.includes('|') && line.trim().startsWith('|')
    
    // Handle table detection
    if (isTableRow && !inTable) {
      // Start of a table - flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      inTable = true
      tableLines = [line]
    } else if (inTable && isTableRow) {
      // Continue table
      tableLines.push(line)
    } else if (inTable && !isTableRow) {
      // End of table - process it
      if (tableLines.length > 0) {
        const tableNode = createTableNode(tableLines)
        if (tableNode) {
          nodes.push(tableNode)
        }
      }
      tableLines = []
      inTable = false
      // Process the current line normally
      i-- // Reprocess this line
      continue
    }
    // Handle headers
    else if (!inTable && line.match(/^#{1,6}\s+/)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      const level = (line.match(/^#+/) || [''])[0].length
      const text = line.replace(/^#+\s+/, '').trim()
      nodes.push(createHeadingNode(text, level))
    }
    // Handle Mermaid placeholders
    else if (!inTable && line.includes('___MERMAID_PLACEHOLDER___')) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      if (mermaidIndex < mermaidDiagrams.length) {
        const diagram = mermaidDiagrams[mermaidIndex]
        // Add the code block
        nodes.push(createCodeBlockNode(diagram.code, 'mermaid'))
        mermaidIndex++
      }
    }
    // Handle Code placeholders
    else if (!inTable && line.includes('___CODE_PLACEHOLDER___')) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      if (codeIndex < codeBlocks.length) {
        const block = codeBlocks[codeIndex]
        nodes.push(createCodeBlockNode(block.code, block.language))
        codeIndex++
      }
    }
    // Handle lists - Convert to paragraphs with bullet/number prefix for now
    else if (!inTable && line.match(/^[\-\*]\s+/)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      // Create paragraph with bullet prefix
      const itemText = line.replace(/^[\-\*]\s+/, '').trim()
      nodes.push(createParagraphNode(`• ${itemText}`))
    }
    // Handle numbered lists
    else if (!inTable && line.match(/^\d+\.\s+/)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      // Create paragraph with number prefix
      const match = line.match(/^(\d+)\.\s+(.*)/)
      if (match) {
        const number = match[1]
        const itemText = match[2].trim()
        nodes.push(createParagraphNode(`${number}. ${itemText}`))
      }
    }
    // Handle blockquotes
    else if (!inTable && line.match(/^>\s+/)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      const quoteText = line.replace(/^>\s+/, '').trim()
      nodes.push(createQuoteNode(quoteText))
    }
    // Handle empty lines
    else if (!inTable && line.trim() === '') {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
    }
    // Handle images
    else if (!inTable && line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        nodes.push(createParagraphNode(currentParagraph.join('\n')))
        currentParagraph = []
      }
      
      // Extract image info
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        const altText = imageMatch[1]
        const src = imageMatch[2]
        nodes.push(createImageNode(src, altText))
      }
    }
    // Regular content
    else if (!inTable) {
      currentParagraph.push(line)
    }
  }
  
  // Flush any remaining table
  if (inTable && tableLines.length > 0) {
    const tableNode = createTableNode(tableLines)
    if (tableNode) {
      nodes.push(tableNode)
    }
  }
  
  // Flush any remaining paragraph
  if (currentParagraph.length > 0) {
    nodes.push(createParagraphNode(currentParagraph.join('\n')))
  }
  
  // If no nodes were created, add a default paragraph
  if (nodes.length === 0) {
    nodes.push(createParagraphNode('Content imported from markdown'))
  }
  
  return {
    root: {
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function createHeadingNode(text: string, level: number): any {
  const tagMap: Record<number, string> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  }
  
  return {
    children: [createTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'heading',
    version: 1,
    tag: tagMap[level] || 'h2',
  }
}

function createParagraphNode(text: string): any {
  // Process inline formatting
  const children = processInlineFormatting(text)
  
  return {
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'paragraph',
    version: 1,
  }
}

function createTableNode(tableLines: string[]): any | null {
  if (tableLines.length < 2) return null // Need at least header and separator
  
  // Parse the table structure
  const rows: string[][] = []
  let headerFound = false
  
  for (const line of tableLines) {
    // Skip the separator line (contains dashes)
    if (line.match(/^\s*\|[\s\-:|]+\|\s*$/)) {
      headerFound = true
      continue
    }
    
    // Split by pipes and clean up cells
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter((_cell, index, arr) => index > 0 && index < arr.length - 1) // Remove first and last empty elements
    
    if (cells.length > 0) {
      rows.push(cells)
    }
  }
  
  if (rows.length === 0) return null
  
  // Create Lexical table structure with proper formatting
  const tableRows = rows.map((row, rowIndex) => ({
    type: 'tablerow',
    version: 1,
    children: row.map(cellText => {
      // Process inline formatting in cell text
      const cellChildren = processInlineFormatting(cellText)
      
      return {
        type: 'tablecell',
        version: 1,
        backgroundColor: null,
        colSpan: 1,
        headerState: rowIndex === 0 && headerFound ? 3 : 0, // 3 for header cells, 0 for normal cells
        rowSpan: 1,
        width: null,
        children: [
          {
            children: cellChildren,
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: rowIndex === 0 && headerFound ? 1 : 0, // Bold for header cells
          }
        ],
      }
    }),
  }))
  
  return {
    type: 'table',
    version: 1,
    children: tableRows,
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}

// Keeping for potential future use when proper list support is added
// function createListNode(items: string[], type: 'bullet' | 'number'): any {
//   return {
//     children: items.map((item, index) => ({
//       children: [
//         {
//           children: [createTextNode(item)],
//           direction: 'ltr',
//           format: '',
//           indent: 0,
//           type: 'paragraph',
//           version: 1,
//         }
//       ],
//       direction: 'ltr',
//       format: '',
//       indent: 0,
//       type: 'listitem',
//       version: 1,
//       value: index + 1,
//     })),
//     direction: 'ltr',
//     format: '',
//     indent: 0,
//     type: 'list',
//     version: 1,
//     listType: type,
//     start: 1,
//     tag: type === 'bullet' ? 'ul' : 'ol',
//   }
// }

function createImageNode(src: string, altText: string): any {
  // For images that are already uploaded to the media collection,
  // we need to extract just the filename
  const filename = src.split('/').pop() || src
  
  return {
    type: 'upload',
    format: '',
    indent: 0,
    version: 1,
    relationTo: 'media',
    value: {
      url: src, // This will be used by processContentImages to map to uploaded media
      filename: filename,
      alt: altText || filename,
    },
  }
}

function createQuoteNode(text: string): any {
  return {
    children: [createTextNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'quote',
    version: 1,
  }
}

function createCodeBlockNode(code: string, language: string): any {
  // Create a proper Payload block node for Code
  return {
    type: 'block',
    fields: {
      blockName: '',
      blockType: 'code',
      code: code,
      language: language || 'plaintext',
    },
    format: '',
    version: 2,
  }
}

function createTextNode(text: string, format: number = 0): any {
  return {
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function processInlineFormatting(text: string): any[] {
  const nodes: any[] = []
  
  // First check for inline images and split the text around them
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const imageParts = text.split(imageRegex)
  
  for (let i = 0; i < imageParts.length; i++) {
    if (i % 3 === 0) {
      // Regular text part (not an image)
      if (imageParts[i]) {
        // Process bold and italic in this text part
        const textNodes = processTextFormatting(imageParts[i])
        nodes.push(...textNodes)
      }
    } else if (i % 3 === 1) {
      // This is alt text for an image, skip it (we'll use it in the next iteration)
      continue
    } else if (i % 3 === 2) {
      // This is the image URL, create an upload node
      const altText = imageParts[i - 1] || ''
      const imageUrl = imageParts[i]
      nodes.push(createInlineImageNode(imageUrl, altText))
    }
  }
  
  // If no nodes were created, just return the plain text
  if (nodes.length === 0) {
    nodes.push(createTextNode(text))
  }
  
  return nodes
}

function processTextFormatting(text: string): any[] {
  const nodes: any[] = []
  
  // Handle bold text
  const boldRegex = /\*\*(.*?)\*\*/g
  const parts = text.split(boldRegex)
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Regular text
      if (parts[i]) {
        // Check for italic
        const italicParts = parts[i].split(/\*(.*?)\*/g)
        for (let j = 0; j < italicParts.length; j++) {
          if (j % 2 === 0) {
            // Regular text
            if (italicParts[j]) {
              nodes.push(createTextNode(italicParts[j], 0))
            }
          } else {
            // Italic text
            if (italicParts[j]) {
              nodes.push(createTextNode(italicParts[j], 2)) // 2 = italic
            }
          }
        }
      }
    } else {
      // Bold text
      if (parts[i]) {
        nodes.push(createTextNode(parts[i], 1)) // 1 = bold
      }
    }
  }
  
  // If no nodes were created, just return the plain text
  if (nodes.length === 0 && text) {
    nodes.push(createTextNode(text))
  }
  
  return nodes
}

function createInlineImageNode(src: string, altText: string): any {
  // For inline images, we create the same upload node structure
  const filename = src.split('/').pop() || src
  
  return {
    type: 'upload',
    format: '',
    indent: 0,
    version: 1,
    relationTo: 'media',
    value: {
      url: src, // This will be used by processContentImages to map to uploaded media
      filename: filename,
      alt: altText || filename,
    },
  }
}

// Helper function to extract excerpt from markdown
export function extractExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown syntax
  const plainText = content
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .trim()
  
  // Truncate to max length
  if (plainText.length <= maxLength) {
    return plainText
  }
  
  // Find the last complete sentence within maxLength
  const truncated = plainText.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (lastSentenceEnd > 0) {
    return plainText.substring(0, lastSentenceEnd + 1)
  }
  
  // If no sentence end found, truncate at last space
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}