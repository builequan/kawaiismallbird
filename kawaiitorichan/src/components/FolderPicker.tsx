'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FolderOpen, 
  Folder, 
  ChevronRight, 
  Home,
  FileText,
  Image,
  Check,
  ArrowUp
} from 'lucide-react'

interface FolderItem {
  name: string
  path: string
  isDirectory: boolean
  hasMarkdownFiles?: boolean
  markdownCount?: number
  hasImages?: boolean
  imageCount?: number
}

interface FolderPickerProps {
  onSelect: (path: string) => void
  selectedPath?: string
  label?: string
  filterType?: 'markdown' | 'images' | 'all'
}

export function FolderPicker({ 
  onSelect, 
  selectedPath, 
  label = 'Select Folder',
  filterType = 'all'
}: FolderPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [items, setItems] = useState<FolderItem[]>([])
  const [commonPaths, setCommonPaths] = useState<any[]>([])
  const [suggestedPaths, setSuggestedPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Load common paths on mount
  useEffect(() => {
    if (isOpen) {
      loadCommonPaths()
      browseFolder(selectedPath || '')
    }
  }, [isOpen])
  
  const loadCommonPaths = async () => {
    try {
      const response = await fetch('/api/browse-folders')
      if (response.ok) {
        const data = await response.json()
        setCommonPaths(data.commonPaths || [])
        setSuggestedPaths(data.suggestedPaths || [])
      }
    } catch (err) {
      console.error('Failed to load common paths:', err)
    }
  }
  
  const browseFolder = async (path: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/browse-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPath: path || undefined }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to browse folder')
      }
      
      const data = await response.json()
      setCurrentPath(data.currentPath)
      setParentPath(data.parentPath)
      
      // Filter items based on type
      let filteredItems = data.items
      if (filterType === 'markdown') {
        filteredItems = data.items.filter((item: FolderItem) => 
          item.isDirectory && (item.hasMarkdownFiles || item.name.includes('export'))
        )
      } else if (filterType === 'images') {
        filteredItems = data.items.filter((item: FolderItem) => 
          item.isDirectory && (item.hasImages || item.name.includes('images'))
        )
      }
      
      setItems(filteredItems)
    } catch (err) {
      setError('Failed to browse folder')
      console.error('Browse error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelect = (path: string) => {
    onSelect(path)
    setIsOpen(false)
  }
  
  const formatPath = (path: string) => {
    const parts = path.split('/')
    if (parts.length > 4) {
      return '.../' + parts.slice(-3).join('/')
    }
    return path
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
            <FolderOpen className="h-4 w-4 text-gray-500" />
            <span className="text-sm truncate">
              {selectedPath ? formatPath(selectedPath) : 'No folder selected'}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
        >
          Browse
        </Button>
      </div>
      
      {isOpen && (
        <Card className="absolute z-50 w-full max-w-2xl mt-2 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Quick access */}
            {suggestedPaths.length > 0 && (
              <div className="border-b p-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-600 mb-2">Suggested Paths:</p>
                <div className="space-y-1">
                  {suggestedPaths.map((path: any) => (
                    <button
                      key={path.path}
                      onClick={() => {
                        if (path.type === filterType || filterType === 'all') {
                          handleSelect(path.path)
                        } else {
                          browseFolder(path.path)
                        }
                      }}
                      className="flex items-center gap-2 w-full text-left p-2 hover:bg-blue-50 rounded text-sm"
                    >
                      {path.type === 'images' ? (
                        <Image className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-500" />
                      )}
                      <span>{path.name}</span>
                      {selectedPath === path.path && (
                        <Check className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Current path */}
            <div className="border-b p-3 bg-gray-50">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Current:</span>
                <span className="font-mono text-xs truncate">{formatPath(currentPath)}</span>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex gap-2 p-3 border-b">
              {commonPaths.map((path: any) => (
                <Button
                  key={path.path}
                  size="sm"
                  variant="outline"
                  onClick={() => browseFolder(path.path)}
                >
                  <Home className="h-3 w-3 mr-1" />
                  {path.name}
                </Button>
              ))}
              {parentPath && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => browseFolder(parentPath)}
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Up
                </Button>
              )}
            </div>
            
            {/* Folder list */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">{error}</div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No folders found</div>
              ) : (
                <div className="divide-y">
                  {items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => browseFolder(item.path)}
                      className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 text-left"
                    >
                      <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 flex gap-3">
                          {item.markdownCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {item.markdownCount} markdown
                            </span>
                          )}
                          {item.imageCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              {item.imageCount} images
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="border-t p-3 bg-gray-50 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSelect(currentPath)}
                disabled={!currentPath}
              >
                Select This Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}