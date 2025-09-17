'use client'

import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidTextProps {
  text: string
}

export default function MermaidText({ text }: MermaidTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Initialize mermaid
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
    
    // Find all Mermaid code sections
    const mermaidSections = text.match(/^`(.+)`$/gm)
    
    if (mermaidSections && mermaidSections.length > 0) {
      // This text contains Mermaid code
      const cleanCode = text
        .replace(/^`(.+)`$/gm, '$1')  // Remove backticks
        .trim()
      
      // Try to render as Mermaid
      const renderMermaid = async () => {
        try {
          const id = `mermaid-${Date.now()}-${Math.random()}`
          const { svg } = await mermaid.render(id, cleanCode)
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
          }
        } catch (error) {
          // Not valid Mermaid, render as text
          if (containerRef.current) {
            containerRef.current.textContent = text
          }
        }
      }
      
      renderMermaid()
    } else {
      // Regular text
      if (containerRef.current) {
        containerRef.current.textContent = text
      }
    }
  }, [text])
  
  return <div ref={containerRef} className="my-4" />
}