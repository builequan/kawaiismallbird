'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

interface Reference {
  id: string
  title: string
  url?: string
  description?: string
}

interface CollapsibleReferencesProps {
  title?: string
  references: Reference[]
  defaultOpen?: boolean
}

export const CollapsibleReferences: React.FC<CollapsibleReferencesProps> = ({
  title = '参考文献・出典',
  references,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-8 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-white hover:from-green-100 hover:to-green-50 transition-colors duration-200"
        aria-expanded={isOpen}
        aria-controls="references-content"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">({references.length}件)</span>
        </div>
      </button>

      <div
        id="references-content"
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-6 py-4 bg-gray-50">
          <ol className="space-y-3">
            {references.map((ref, index) => (
              <li key={ref.id} className="flex items-start gap-3">
                <span className="text-sm font-medium text-gray-500 mt-0.5">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  <div className="text-sm text-gray-700">
                    {ref.title}
                    {ref.description && (
                      <span className="text-gray-500 ml-1">- {ref.description}</span>
                    )}
                  </div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      <span className="max-w-[500px] truncate">{ref.url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// Simplified version for inline use in articles
export const SimpleCollapsibleReferences: React.FC<{
  references: string[]
  title?: string
  defaultOpen?: boolean
}> = ({ references, title = '出典・参考文献', defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-6 text-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-800 font-medium"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {title} ({references.length})
      </button>
      {isOpen && (
        <ul className="mt-2 ml-5 space-y-1 text-gray-600">
          {references.map((ref, index) => (
            <li key={index} className="break-all">
              {index + 1}. {ref}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}