'use client'
import { Highlight, themes } from 'prism-react-renderer'
import React, { useEffect, useRef, useState } from 'react'
import { CopyButton } from './CopyButton'
import mermaid from 'mermaid'

type Props = {
  code: string
  language?: string
}

export const Code: React.FC<Props> = ({ code, language = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isError, setIsError] = useState(false)
  
  // Handle Mermaid diagrams - Only show the visual diagram
  const isMermaid = language === 'mermaid'
  
  useEffect(() => {
    if (isMermaid && code && containerRef.current) {
        mermaid.initialize({ 
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
        })

        const renderDiagram = async () => {
          try {
            setIsError(false)
            containerRef.current!.innerHTML = ''
            const id = `mermaid-${Date.now()}`
            
            // Clean up the diagram code
            const cleanCode = code
              .trim()
              .replace(/^\`\`\`mermaid\s*/i, '')
              .replace(/\`\`\`\s*$/, '')
              .trim()
            
            const { svg } = await mermaid.render(id, cleanCode)
            containerRef.current!.innerHTML = svg
            
            // Make SVG responsive and full width
            const svgElement = containerRef.current!.querySelector('svg')
            if (svgElement) {
              svgElement.style.width = '100%'
              svgElement.style.maxWidth = '100%'
              svgElement.style.height = 'auto'
              svgElement.style.margin = '0'
            }
          } catch (error) {
            console.error('Error rendering Mermaid diagram:', error)
            setIsError(true)
          }
        }

        renderDiagram()
    }
  }, [code, isMermaid])

  if (!code) return null

  if (isMermaid) {
    return (
      <div className="my-8 w-full">
        {isError ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">Error rendering diagram. Please check the Mermaid syntax.</p>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        ) : (
          <div 
            ref={containerRef} 
            className="mermaid-diagram w-full overflow-x-auto"
            style={{ width: '100%' }}
          />
        )}
      </div>
    )
  }

  // Regular code blocks
  return (
    <Highlight code={code} language={language} theme={themes.vsDark}>
      {({ getLineProps, getTokenProps, tokens }) => (
        <pre className="bg-black p-4 border text-xs border-border rounded overflow-x-auto">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ className: 'table-row', line })}>
              <span className="table-cell select-none text-right text-white/25">{i + 1}</span>
              <span className="table-cell pl-4">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
          <CopyButton code={code} />
        </pre>
      )}
    </Highlight>
  )
}