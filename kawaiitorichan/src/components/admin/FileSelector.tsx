'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// ScrollArea component removed - using native scroll
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileJson,
  Search,
  ChevronUp,
  ChevronDown,
  Calendar,
  HardDrive,
  Package,
  Trash2,
  FileUp,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FileInfo {
  name: string
  path?: string
  size: number
  sizeFormatted: string
  dateModified: string
  dateFormatted: string
  productCount?: number
  source?: string
  preview?: Array<{
    name: string
    price: string
    keyword: string
  }>
}

interface FileSelectorProps {
  onFileSelect: (files: FileInfo[]) => void
  onFileUpload?: (file: File) => void
  multiSelect?: boolean
  allowDelete?: boolean
  filter?: string
}

export default function FileSelector({
  onFileSelect,
  onFileUpload,
  multiSelect = false,
  allowDelete = false,
  filter = '',
}: FileSelectorProps) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch files from API
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        filter: filter || searchTerm,
        sortBy,
        sortOrder,
      })
      
      const response = await fetch(`/api/affiliate-links/list-files?${params}`, {
        credentials: 'include',
      })
      
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load files from Downloads folder',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [sortBy, sortOrder])

  // Handle file selection
  const handleFileToggle = (fileName: string) => {
    const newSelected = new Set(selectedFiles)
    
    if (multiSelect) {
      if (newSelected.has(fileName)) {
        newSelected.delete(fileName)
      } else {
        newSelected.add(fileName)
      }
    } else {
      // Single select mode
      if (newSelected.has(fileName)) {
        newSelected.clear()
      } else {
        newSelected.clear()
        newSelected.add(fileName)
      }
    }
    
    setSelectedFiles(newSelected)
    
    // Notify parent component
    const selectedFileInfos = files.filter(f => newSelected.has(f.name))
    onFileSelect(selectedFileInfos)
  }

  // Handle file deletion
  const handleDeleteFiles = async (fileNames: string[]) => {
    if (!confirm(`Delete ${fileNames.length} file(s)? This cannot be undone.`)) return
    
    try {
      const response = await fetch('/api/affiliate-links/delete-files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ files: fileNames }),
      })
      
      if (!response.ok) throw new Error('Failed to delete files')
      
      const result = await response.json()
      toast({
        title: 'Files Deleted',
        description: result.message,
      })
      
      // Refresh file list
      await fetchFiles()
      setSelectedFiles(new Set())
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete selected files',
        variant: 'destructive',
      })
    }
  }

  // Handle file upload
  const handleFileUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onFileUpload) {
      // Check if file is JSON by extension or MIME type
      const isJson = file.name.toLowerCase().endsWith('.json') || 
                     file.type === 'application/json' ||
                     file.type === 'text/json'
      
      if (isJson) {
        onFileUpload(file)
        setUploadedFileName(file.name)
        toast({
          title: 'File Selected',
          description: `${file.name} ready for import`,
        })
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a JSON file',
          variant: 'destructive',
        })
        // Reset the input
        event.target.value = ''
      }
    }
  }

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Tabs defaultValue="browse" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="browse">Browse Downloads</TabsTrigger>
        <TabsTrigger value="upload">Upload File</TabsTrigger>
      </TabsList>
      
      <TabsContent value="browse" className="space-y-4">
        {/* Search and Sort Controls */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFiles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* File List */}
        <div className="h-[150px] border rounded-md overflow-y-auto">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No JSON files found in Downloads folder
              </div>
            ) : (
              filteredFiles.map((file) => (
                <Card
                  key={file.name}
                  className={`cursor-pointer transition-colors ${
                    selectedFiles.has(file.name) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedFiles.has(file.name)}
                          onCheckedChange={() => handleFileToggle(file.name)}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {file.dateFormatted}
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {file.sizeFormatted}
                            </span>
                            {file.productCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {file.productCount} products
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {file.source && (
                          <Badge variant="outline" className="text-xs">
                            {file.source}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedFile(expandedFile === file.name ? null : file.name)
                          }}
                        >
                          {expandedFile === file.name ? 'Hide' : 'Preview'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedFile === file.name && file.preview && (
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Sample Products:
                        </div>
                        {file.preview.map((product, idx) => (
                          <div key={idx} className="text-xs space-y-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-muted-foreground">
                              Price: {product.price} | Keyword: {product.keyword || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            {allowDelete && selectedFiles.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {selectedFiles.size > 0 && (
              <span>{selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected</span>
            )}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="upload" className="pt-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="json-file-upload" className="text-sm">Upload JSON File from Computer</Label>
            <Input
              id="json-file-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleFileUploadChange}
              className="mt-1 h-9"
            />
          </div>
          
          {uploadedFileName && (
            <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <FileJson className="h-3 w-3" />
                <span className="font-medium">Ready: {uploadedFileName}</span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Supports: JSON arrays or objects with "products" field (Max 50MB)
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}