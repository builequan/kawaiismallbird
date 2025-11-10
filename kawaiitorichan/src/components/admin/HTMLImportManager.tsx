'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileHtml,
  AlertCircle,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

interface UploadResult {
  filename: string
  postId?: string
  title?: string
  slug?: string
  categories?: string[]
  unmatchedCategories?: string[]
  imagesUploaded?: number
  error?: string
  message?: string
}

interface UploadSummary {
  total: number
  successful: number
  failed: number
  warnings: number
}

interface CategorySelectionDialog {
  isOpen: boolean
  availableCategories: Array<{ id: string; title: string }>
  selectedCategory: string | null
  filename: string
}

const HTMLImportManager: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [results, setResults] = useState<{
    success: UploadResult[]
    failed: UploadResult[]
    warnings: UploadResult[]
  } | null>(null)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const htmlFiles = files.filter(
      file => file.name.endsWith('.html') || file.name.endsWith('.htm'),
    )

    if (htmlFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please select HTML files only (.html or .htm)',
        variant: 'destructive',
      })
      return
    }

    if (htmlFiles.length !== files.length) {
      toast({
        title: 'Some files skipped',
        description: `${files.length - htmlFiles.length} non-HTML files were skipped`,
        variant: 'default',
      })
    }

    setSelectedFiles(htmlFiles)
    setResults(null)
    setSummary(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select HTML files to upload',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/html-import/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setSummary(data.summary)

        toast({
          title: 'Upload Complete',
          description: `Successfully imported ${data.summary.successful} out of ${data.summary.total} files`,
        })
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(100)
    }
  }

  const handleClear = () => {
    setSelectedFiles([])
    setResults(null)
    setSummary(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const htmlFiles = files.filter(
      file => file.name.endsWith('.html') || file.name.endsWith('.htm'),
    )

    if (htmlFiles.length > 0) {
      setSelectedFiles(htmlFiles)
      setResults(null)
      setSummary(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HTML Bulk Upload</h1>
              <p className="text-gray-600 mt-1">
                Upload HTML files to automatically create blog posts
              </p>
            </div>
            <FileHtml className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        {/* Summary Alert */}
        {summary && (
          <Alert
            className={
              summary.failed === 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }
          >
            {summary.failed === 0 ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>Upload Complete</AlertTitle>
            <AlertDescription>
              Total: {summary.total} | Success: {summary.successful} | Failed: {summary.failed}
              {summary.warnings > 0 && ` | Warnings: ${summary.warnings}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Area */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900">Upload HTML Files</CardTitle>
            <CardDescription className="text-gray-600">
              Select or drag & drop HTML files to upload. Files will be converted to blog posts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop HTML files here
                </p>
                <p className="text-sm text-gray-500">or</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".html,.htm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file(s) selected
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload & Convert
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      disabled={isUploading}
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-6 space-y-2">
                <Progress value={uploadProgress} className="bg-gray-200" />
                <p className="text-sm text-gray-600 text-center">
                  Processing files... Please wait
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !results && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900">Selected Files</CardTitle>
              <CardDescription className="text-gray-600">
                {selectedFiles.length} HTML file(s) ready to upload
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-700">Filename</TableHead>
                      <TableHead className="text-gray-700">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFiles.map((file, index) => (
                      <TableRow key={index} className="border-gray-200">
                        <TableCell className="font-medium text-gray-900">{file.name}</TableCell>
                        <TableCell className="text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <>
            {/* Success Results */}
            {results.success.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="bg-green-50 border-b border-green-200">
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Successfully Imported ({results.success.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow className="border-gray-200">
                          <TableHead className="text-gray-700">Filename</TableHead>
                          <TableHead className="text-gray-700">Title</TableHead>
                          <TableHead className="text-gray-700">Slug</TableHead>
                          <TableHead className="text-gray-700">Categories</TableHead>
                          <TableHead className="text-gray-700">Images</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.success.map((result, index) => (
                          <TableRow key={index} className="border-gray-200">
                            <TableCell className="font-medium text-gray-900">
                              {result.filename}
                            </TableCell>
                            <TableCell className="text-gray-700">{result.title}</TableCell>
                            <TableCell className="text-gray-600 font-mono text-sm">
                              {result.slug}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {result.categories?.map((cat, i) => (
                                  <Badge
                                    key={i}
                                    className="bg-blue-100 text-blue-800 border-blue-200"
                                  >
                                    {cat}
                                  </Badge>
                                ))}
                                {(!result.categories || result.categories.length === 0) && (
                                  <Badge
                                    variant="outline"
                                    className="border-gray-300 text-gray-600"
                                  >
                                    None
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {result.imagesUploaded || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <Card className="bg-white border-yellow-200 shadow-sm">
                <CardHeader className="bg-yellow-50 border-b border-yellow-200">
                  <CardTitle className="text-yellow-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Warnings ({results.warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {results.warnings.map((warning, index) => (
                      <Alert key={index} className="bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>{warning.filename}:</strong> {warning.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Failed Results */}
            {results.failed.length > 0 && (
              <Card className="bg-white border-red-200 shadow-sm">
                <CardHeader className="bg-red-50 border-b border-red-200">
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Failed ({results.failed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700">Filename</TableHead>
                        <TableHead className="text-gray-700">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.failed.map((result, index) => (
                        <TableRow key={index} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">
                            {result.filename}
                          </TableCell>
                          <TableCell className="text-red-600">{result.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-900">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p>
              <strong>1. Title:</strong> Extracted from <code>&lt;title&gt;</code> tag or{' '}
              <code>&lt;h1&gt;</code> tag
            </p>
            <p>
              <strong>2. Slug:</strong> Generated from filename (duplicates get -1, -2, etc.)
            </p>
            <p>
              <strong>3. Content:</strong> Extracted from <code>&lt;body&gt;</code> content
            </p>
            <p>
              <strong>4. Categories:</strong> Auto-assigned based on title keywords
            </p>
            <p>
              <strong>5. Images:</strong> All images extracted and uploaded to media library
            </p>
            <p>
              <strong>6. Status:</strong> Posts are published immediately with current date
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HTMLImportManager
