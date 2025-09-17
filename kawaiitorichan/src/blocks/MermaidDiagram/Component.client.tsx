'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

type Props = {
  diagramCode: string
  title?: string
  caption?: string
}

export const MermaidDiagram: React.FC<Props> = ({ diagramCode, title, caption }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isError, setIsError] = useState(false)
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    if (containerRef.current && diagramCode && !showCode) {
      mermaid.initialize({ 
        startOnLoad: true,
        theme: 'base',
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
        },
        themeVariables: {
          primaryColor: '#48BB78',  // Golf green
          primaryTextColor: '#2D3748',  // Dark charcoal
          primaryBorderColor: '#2D3748',  // Dark charcoal
          lineColor: '#2D3748',  // Dark charcoal
          sectionBkgColor: '#F8F9FA',  // Light background
          altSectionBkgColor: '#E2E8F0',  // Slightly darker gray
          gridColor: '#CBD5E0',  // Light gray
          secondaryColor: '#38A169',  // Darker green
          tertiaryColor: '#2F855A',  // Even darker green
        },
      })

      const renderDiagram = async () => {
        try {
          setIsError(false)
          containerRef.current!.innerHTML = ''
          const id = `mermaid-${Date.now()}`
          
          // Clean up the diagram code - remove any potential issues
          const cleanCode = diagramCode
            .trim()
            .replace(/^\`\`\`mermaid\s*/i, '')
            .replace(/\`\`\`\s*$/, '')
            .trim()
          
          const { svg } = await mermaid.render(id, cleanCode)
          containerRef.current!.innerHTML = svg
        } catch (error) {
          console.error('Error rendering Mermaid diagram:', error)
          console.error('Diagram code:', diagramCode)
          setIsError(true)
        }
      }

      renderDiagram()
    }
  }, [diagramCode, showCode])

  const cleanCode = diagramCode
    .trim()
    .replace(/^\`\`\`mermaid\s*/i, '')
    .replace(/\`\`\`\s*$/, '')
    .trim()

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      
      {/* Toggle buttons */}
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => setShowCode(false)}
          className={`px-4 py-2 rounded transition-colors ${
            !showCode 
              ? 'bg-golf-green text-white' 
              : 'bg-gray-200 text-golf-gray hover:bg-gray-300'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setShowCode(true)}
          className={`px-4 py-2 rounded transition-colors ${
            showCode 
              ? 'bg-golf-green text-white' 
              : 'bg-gray-200 text-golf-gray hover:bg-gray-300'
          }`}
        >
          Code
        </button>
      </div>

      {/* Content area */}
      <div className="flex justify-center">
        {showCode ? (
          <div className="w-full max-w-4xl">
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">mermaid</span>
                <button
                  onClick={() => navigator.clipboard.writeText(`\`\`\`mermaid\n${cleanCode}\n\`\`\``)}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="text-gray-100">
                <code>{cleanCode}</code>
              </pre>
            </div>
          </div>
        ) : (
          <>
            {isError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600">Error rendering diagram. Please check the Mermaid syntax.</p>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  <code>{cleanCode}</code>
                </pre>
              </div>
            ) : (
              <div 
                ref={containerRef} 
                className="mermaid-diagram max-w-full overflow-x-auto"
              />
            )}
          </>
        )}
      </div>
      
      {caption && (
        <p className="text-sm text-gray-600 text-center mt-4 italic">{caption}</p>
      )}
    </div>
  )
}