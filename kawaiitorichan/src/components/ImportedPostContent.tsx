'use client'

import React, { useEffect, useRef } from 'react'
import { marked } from 'marked'
import mermaid from 'mermaid'

interface ImportedPostContentProps {
  content: any
  className?: string
}

export default function ImportedPostContent({ content, className = '' }: ImportedPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
    
    // Render mermaid diagrams after content is loaded
    if (contentRef.current) {
      const mermaidElements = contentRef.current.querySelectorAll('.mermaid')
      mermaidElements.forEach(async (element, index) => {
        const graphDefinition = element.textContent || ''
        try {
          const id = `mermaid-${Date.now()}-${index}`
          const { svg } = await mermaid.render(id, graphDefinition)
          element.innerHTML = svg
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          element.innerHTML = `<pre class="text-red-500">Error rendering diagram</pre>`
        }
      })
    }
  }, [content])
  
  // Extract text from Lexical content structure
  const extractContent = (data: any): string => {
    if (!data) return ''
    
    // If it's a Lexical structure with multiple paragraphs
    if (data.root && data.root.children && data.root.children.length > 0) {
      const paragraphs: string[] = []
      
      data.root.children.forEach((child: any) => {
        if (child.type === 'paragraph' && child.children) {
          const paragraphText = child.children
            .map((textNode: any) => textNode.text || '')
            .join('')
          
          if (paragraphText.trim()) {
            paragraphs.push(paragraphText)
          }
        }
      })
      
      // Join paragraphs with double newlines for markdown
      return paragraphs.join('\n\n')
    }
    
    // If it's already a string
    if (typeof data === 'string') {
      return data
    }
    
    return ''
  }
  
  const renderContent = () => {
    const rawContent = extractContent(content)
    
    if (!rawContent) {
      return <p className="text-gray-500">No content available</p>
    }
    
    // Process the content to handle mermaid blocks
    let processedContent = rawContent
    
    // Convert mermaid code blocks to div elements
    processedContent = processedContent.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (match, diagram) => {
        return `<div class="mermaid my-8">${diagram.trim()}</div>`
      }
    )
    
    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(processedContent)
    
    return (
      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }
  
  return (
    <div className={className}>
      {renderContent()}
    </div>
  )
}