// Custom handler for table nodes in imported content
// This converts table nodes to a simple HTML-like structure that can be rendered

export function convertTableNode(tableNode: any): any {
  // If it's not a table node, return as is
  if (tableNode?.type !== 'table') {
    return tableNode
  }

  // Convert table to a paragraph with formatted text
  // Since Lexical doesn't have native table support, we'll convert to formatted text
  const rows = tableNode.children || []
  const formattedRows: any[] = []

  rows.forEach((row: any) => {
    if (row.type === 'tablerow' && row.children) {
      const cells = row.children.map((cell: any) => {
        if (cell.type === 'tablecell' && cell.children) {
          // Extract text from cell
          const cellText = extractTextFromNodes(cell.children)
          return cellText
        }
        return ''
      })
      
      // Join cells with " | " separator
      if (cells.length > 0) {
        formattedRows.push(cells.join(' | '))
      }
    }
  })

  // Convert to paragraph nodes with formatted text
  if (formattedRows.length > 0) {
    // Add a separator line after the header (first row)
    if (formattedRows.length > 1) {
      const headerSeparator = '―'.repeat(formattedRows[0].length)
      formattedRows.splice(1, 0, headerSeparator)
    }

    // Return multiple paragraph nodes, one for each row
    return formattedRows.map(row => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'text',
          format: 0, // Use monospace format for table-like appearance
          style: '',
          detail: 0,
          mode: 'normal',
          text: row,
          version: 1
        }
      ],
      direction: 'ltr'
    }))
  }

  // If no valid rows, return empty paragraph
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'text',
        format: 0,
        style: '',
        detail: 0,
        mode: 'normal',
        text: '[Table content]',
        version: 1
      }
    ],
    direction: 'ltr'
  }
}

function extractTextFromNodes(nodes: any[]): string {
  if (!nodes || !Array.isArray(nodes)) return ''
  
  return nodes.map(node => {
    if (node.type === 'text') {
      return node.text || ''
    } else if (node.type === 'paragraph' && node.children) {
      return extractTextFromNodes(node.children)
    }
    return ''
  }).join(' ')
}

// Process content to handle table nodes
export function processContentWithTables(content: any): any {
  if (!content || !content.root || !content.root.children) {
    return content
  }

  const processedChildren: any[] = []
  
  content.root.children.forEach((node: any) => {
    if (node.type === 'table') {
      // Convert table node to paragraph nodes
      const converted = convertTableNode(node)
      if (Array.isArray(converted)) {
        processedChildren.push(...converted)
      } else {
        processedChildren.push(converted)
      }
    } else {
      processedChildren.push(node)
    }
  })

  return {
    ...content,
    root: {
      ...content.root,
      children: processedChildren
    }
  }
}