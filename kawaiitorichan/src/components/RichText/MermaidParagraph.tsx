'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidParagraphProps {
  text: string
}

export default function MermaidParagraph({ text }: MermaidParagraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMermaid, setIsMermaid] = useState(false)
  const [renderError, setRenderError] = useState(false)
  
  useEffect(() => {
    if (!text) return
    
    // Check if this looks like Mermaid code
    const mermaidKeywords = ['flowchart', 'graph', 'sequenceDiagram', 'gantt', 'pie', 'erDiagram', 'journey', 'gitGraph']
    const looksLikeMermaid = mermaidKeywords.some(keyword => text.trim().startsWith(keyword))
    
    if (looksLikeMermaid) {
      setIsMermaid(true)
      
      // Initialize mermaid with a unique ID
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        deterministicIds: true,
        deterministicIdSeed: 'mermaid-seed'
      })
      
      // Render the diagram
      const renderDiagram = async () => {
        try {
          // Make sure we have a container
          if (!containerRef.current) {
            console.warn('Container ref not ready')
            return
          }
          
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          console.log('Rendering Mermaid diagram with text:', text.substring(0, 50))
          
          const { svg } = await mermaid.render(id, text)
          
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
            // Remove any centering to allow full width
            containerRef.current.classList.add('my-8', 'w-full', 'overflow-x-auto')
            
            // Style the SVG to be full width and responsive
            const svgElement = containerRef.current.querySelector('svg')
            if (svgElement) {
              svgElement.style.width = '100%'
              svgElement.style.maxWidth = '100%'
              svgElement.style.height = 'auto'
              // Remove any margin that might center it
              svgElement.style.margin = '0'
            }
            
            console.log('Mermaid diagram rendered successfully')
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error)
          console.error('Failed text:', text)
          setRenderError(true)
          setIsMermaid(false)
        }
      }
      
      // Small delay to ensure DOM is ready
      setTimeout(renderDiagram, 100)
    }
  }, [text])
  
  if (isMermaid && !renderError) {
    return <div ref={containerRef} className="w-full" />
  }
  
  // If error or not Mermaid, show the code as text
  return <pre className="bg-gray-100 p-4 rounded overflow-x-auto w-full"><code>{text}</code></pre>
}