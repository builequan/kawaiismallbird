import React from 'react'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  SerializedParagraphNode,
  SerializedTableNode,
  SerializedTableRowNode,
  SerializedTableCellNode,
  SerializedUploadNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'
import { ShoppingCart } from 'lucide-react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
  MermaidDiagramBlock as MermaidDiagramBlockProps,
  AffiliateShowcaseBlock as AffiliateShowcaseBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { MermaidDiagramBlock } from '@/blocks/MermaidDiagram/Component'
import { AffiliateShowcaseBlock } from '@/blocks/AffiliateShowcase/Component'
import MermaidParagraph from './MermaidParagraph'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps | MermaidDiagramBlockProps | AffiliateShowcaseBlockProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => {
  // Get the default link converter
  const defaultLinkConverters = LinkJSXConverter({ internalDocToHref })
  
  return {
    ...defaultConverters,
    ...defaultLinkConverters,
    // Upload converter for images
    upload: ({ node }: { node: SerializedUploadNode }) => {
      const value = node.value

      // Handle different value types
      if (typeof value === 'object' && value !== null) {
        // Check if value has media data with url
        if ('url' in value && typeof value.url === 'string') {
          // Fix the URL path - replace /api/media/file/ with /media/
          const correctedUrl = value.url.replace('/api/media/file/', '/media/')
          return (
            <div className="my-4">
              <img
                src={correctedUrl}
                alt={value.alt as string || 'Image'}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )
        }

        // If value has filename, use it to construct the public media path
        if ('filename' in value && typeof value.filename === 'string') {
          return (
            <div className="my-4">
              <img
                src={`/media/${value.filename}`}
                alt={value.alt as string || 'Image'}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )
        }

        // If value only has an id (reference to media)
        if ('id' in value && !('url' in value)) {
          // Use the media-by-id API to fetch and display the image
          const mediaId = typeof value.id === 'number' ? value.id : String(value.id)
          return (
            <div className="my-4">
              <img
                src={`/api/media-by-id/${mediaId}`}
                alt={value.alt as string || 'Image'}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )
        }
      }

      // If value is a string ID
      if (typeof value === 'string') {
        // Use the media-by-id API to fetch and display the image
        return (
          <div className="my-4">
            <img
              src={`/api/media-by-id/${value}`}
              alt="Image"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )
      }

      // Fallback for unhandled cases
      console.warn('Unhandled upload node value:', value)
      return <div className="my-4 p-4 bg-gray-100 rounded">Image placeholder</div>
    },
    // Override link converter for affiliate links and internal links
    link: ({ node, nodesToJSX }) => {
    const rel = node.fields?.rel as string | undefined
    const url = node.fields?.url as string | undefined
    const newTab = node.fields?.newTab as boolean | undefined
    const linkType = node.fields?.linkType as string | undefined
    const doc = node.fields?.doc as any | undefined
    
    // Handle internal links
    let href = url || '#'
    if (linkType === 'internal' && doc) {
      // Use the defaultLinkConverters function to get the proper href
      try {
        href = internalDocToHref({ linkNode: node as SerializedLinkNode })
      } catch (error) {
        console.error('Error generating internal link href:', error)
        href = '#'
      }
    }
    
    // Check if this is an affiliate link
    const isAffiliate = rel?.includes('sponsored') || url?.includes('a8.net') || url?.includes('rakuten')
    
    // Style for affiliate links
    const affiliateStyles = isAffiliate ? {
      color: '#2563eb',
      textDecoration: 'underline',
      textDecorationColor: '#2563eb',
      textUnderlineOffset: '3px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
      position: 'relative' as const,
      padding: '2px 4px',
    } : {}
    
    return (
      <a
        href={href}
        target={newTab ? '_blank' : undefined}
        rel={rel}
        style={affiliateStyles}
        className={isAffiliate ? 'affiliate-link hover:bg-blue-50' : ''}
        onMouseEnter={(e) => {
          if (isAffiliate) {
            e.currentTarget.style.color = '#1d4ed8'
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)'
            e.currentTarget.style.borderRadius = '4px'
          }
        }}
        onMouseLeave={(e) => {
          if (isAffiliate) {
            e.currentTarget.style.color = '#2563eb'
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderRadius = '0'
          }
        }}
      >
        {node.children && nodesToJSX({ nodes: node.children })}
      </a>
    )
  },
  // List support for better formatting
  list: ({ node, nodesToJSX }) => {
    const Tag = node.listType === 'number' ? 'ol' : 'ul'
    const listStyles = node.listType === 'number'
      ? 'list-decimal list-inside space-y-2 my-4 pl-4'
      : 'list-disc list-inside space-y-2 my-4 pl-4'

    return (
      <Tag className={listStyles}>
        {node.children && nodesToJSX({ nodes: node.children })}
      </Tag>
    )
  },
  listitem: ({ node, nodesToJSX }) => {
    return (
      <li className="text-gray-700">
        {node.children && nodesToJSX({ nodes: node.children })}
      </li>
    )
  },
  // Text formatting support with citation fallback
  text: ({ node }) => {
    let text = node.text || ''

    // SAFETY NET: Check for citation markdown pattern [[number]](url) in plain text
    // This catches cases where citations weren't converted to link nodes
    const citationPattern = /\[\[(\d+)\]\]\((https?:\/\/[^)]+)\)/g

    if (citationPattern.test(text)) {
      // Split text into parts and create links for citations
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      const regex = /\[\[(\d+)\]\]\((https?:\/\/[^)]+)\)/g
      let match
      let key = 0

      while ((match = regex.exec(text)) !== null) {
        // Add text before citation
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index))
        }

        // Add citation link
        parts.push(
          <a
            key={`citation-${key++}`}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            [{match[1]}]
          </a>
        )

        lastIndex = regex.lastIndex
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex))
      }

      // Apply formatting to the entire result
      let content: React.ReactNode = <>{parts}</>

      if (node.format & 16) { // Code (16)
        content = <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">{content}</code>
      }
      if (node.format & 4) { // Strikethrough (4)
        content = <s>{content}</s>
      }
      if (node.format & 8) { // Underline (8)
        content = <u>{content}</u>
      }
      if (node.format & 2) { // Italic (2)
        content = <em>{content}</em>
      }
      if (node.format & 1) { // Bold (1)
        content = <strong>{content}</strong>
      }

      return content
    }

    // Normal text without citations
    let content: React.ReactNode = text

    // Apply formatting based on format flags (can be combined)
    if (node.format & 16) { // Code (16)
      content = <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">{content}</code>
    }
    if (node.format & 4) { // Strikethrough (4)
      content = <s>{content}</s>
    }
    if (node.format & 8) { // Underline (8)
      content = <u>{content}</u>
    }
    if (node.format & 2) { // Italic (2)
      content = <em>{content}</em>
    }
    if (node.format & 1) { // Bold (1)
      content = <strong>{content}</strong>
    }

    return content
  },
  // Table support
  table: ({ node, nodesToJSX }) => {
    // Separate header rows from body rows
    const headerRows = node.children?.filter((row: any) => 
      row.children?.some((cell: any) => cell.headerState === 3)
    ) || []
    const bodyRows = node.children?.filter((row: any) => 
      !row.children?.some((cell: any) => cell.headerState === 3)
    ) || []
    
    return (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          {headerRows.length > 0 && (
            <thead className="bg-gray-50">
              {nodesToJSX({ nodes: headerRows })}
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {nodesToJSX({ nodes: bodyRows })}
          </tbody>
        </table>
      </div>
    )
  },
  tablerow: ({ node, nodesToJSX }) => {
    return (
      <tr>
        {node.children && nodesToJSX({ nodes: node.children })}
      </tr>
    )
  },
  tablecell: ({ node, nodesToJSX }) => {
    const isHeader = node.headerState === 3
    const Tag = isHeader ? 'th' : 'td'
    return (
      <Tag 
        className={`px-4 py-3 text-sm ${
          isHeader 
            ? 'font-semibold text-gray-900 bg-green-50 text-left' 
            : 'text-gray-700'
        } border-b border-gray-200`}
        colSpan={node.colSpan || 1}
        rowSpan={node.rowSpan || 1}
      >
        {node.children && nodesToJSX({ nodes: node.children })}
      </Tag>
    )
  },
  // Custom code converter to handle Mermaid
  code: ({ node }) => {
    // Check if this is a Mermaid code block
    if (node.language === 'mermaid' && node.children && node.children.length > 0) {
      const codeText = node.children.map((child: any) => 
        child.type === 'code-highlight' ? child.text : ''
      ).join('')
      
      if (codeText) {
        return <MermaidParagraph text={codeText} />
      }
    }
    // Use default code converter for non-Mermaid code
    return defaultConverters.code ? defaultConverters.code({ node }) : null
  },
  // Custom paragraph converter to handle Mermaid code and markdown images
  paragraph: ({ node, nodesToJSX }) => {
    // Check if this paragraph contains Mermaid code or markdown images
    if (node.children && node.children.length > 0) {
      const firstChild = node.children[0]

      // Check for text that starts with ```mermaid
      if (firstChild.type === 'text') {
        const text = firstChild.text

        // Check if it's a Mermaid code block
        if (text.startsWith('```mermaid\n') && text.endsWith('```')) {
          // Extract the Mermaid code without the backticks
          const mermaidCode = text.replace(/^```mermaid\n/, '').replace(/\n?```$/, '')
          return <MermaidParagraph text={mermaidCode} />
        }

        // Also check for code-formatted Mermaid
        if (firstChild.format === 16) { // 16 is code format
          const mermaidKeywords = ['flowchart', 'graph', 'sequenceDiagram', 'gantt', 'pie', 'erDiagram', 'classDiagram', 'stateDiagram', 'journey', 'gitGraph']

          if (mermaidKeywords.some(keyword => text.trim().startsWith(keyword))) {
            return <MermaidParagraph text={text} />
          }
        }

        // Check for markdown images
        const imagePattern = /^!\[([^\]]*)\]\(([^)]+)\)$/
        const match = imagePattern.exec(text.trim())
        if (match) {
          const alt = match[1] || 'Image'
          const url = match[2]
          return (
            <div className="my-4">
              <img
                src={url}
                alt={alt}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )
        }

        // Check for [Image: ...] format from our conversion
        const placeholderPattern = /^\[Image: ([^\]]+)\]$/
        const placeholderMatch = placeholderPattern.exec(text.trim())
        if (placeholderMatch) {
          // This is a placeholder, show it as a gray box
          return (
            <div className="my-4 p-4 bg-gray-100 rounded text-gray-600 italic">
              {text}
            </div>
          )
        }
      }
    }
    // Use default paragraph converter
    return defaultConverters.paragraph({ node, nodesToJSX })
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
    mermaidDiagram: ({ node }) => (
      <MermaidDiagramBlock className="col-start-2 mb-4" {...node.fields} />
    ),
    affiliateShowcase: ({ node }) => (
      <AffiliateShowcaseBlock {...node.fields} />
    ),
  },
}
}

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md prose-gray': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
