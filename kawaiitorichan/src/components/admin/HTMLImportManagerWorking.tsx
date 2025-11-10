'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileHtml } from 'lucide-react'

export default function HTMLImportManagerWorking() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const htmlFiles = files.filter(
      file => file.name.endsWith('.html') || file.name.endsWith('.htm'),
    )
    setSelectedFiles(htmlFiles)
    setResults(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select HTML files to upload')
      return
    }

    setIsUploading(true)

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
      setResults(data)
      alert(`Upload complete! ${data.summary?.successful || 0} files imported successfully.`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setSelectedFiles([])
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HTML Bulk Upload</h1>
        <p className="text-gray-600">Upload HTML files to automatically create blog posts</p>
      </div>

      {/* Upload Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileHtml className="h-5 w-5" />
            Upload HTML Files
          </CardTitle>
          <CardDescription>
            Select or drag & drop HTML files. Files will be converted to blog posts automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">Select HTML files</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".html,.htm"
                onChange={handleFileSelect}
                className="block mx-auto"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file(s) selected
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Uploading...' : 'Upload & Convert'}
                    </Button>
                    <Button
                      onClick={handleClear}
                      disabled={isUploading}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && !results && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selected Files</CardTitle>
            <CardDescription>{selectedFiles.length} HTML file(s) ready to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline">{(file.size / 1024).toFixed(2)} KB</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Summary */}
          {results.summary && (
            <Card className="mb-6 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Upload Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{results.summary.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary.successful}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
                  </div>
                  {results.summary.warnings > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">{results.summary.warnings}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success List */}
          {results.results?.success?.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-green-900">Successfully Imported ({results.results.success.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.results.success.map((result: any, index: number) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{result.filename}</p>
                          <p className="text-sm text-gray-600">Title: {result.title}</p>
                          <p className="text-sm text-gray-600">Slug: {result.slug}</p>
                        </div>
                        <div className="flex gap-1">
                          {result.categories?.map((cat: string, i: number) => (
                            <Badge key={i}>{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed List */}
          {results.results?.failed?.length > 0 && (
            <Card className="mb-6 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Failed ({results.results.failed.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.results.failed.map((result: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-medium">{result.filename}</p>
                      <p className="text-sm text-red-600">{result.error}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>Title:</strong> Extracted from &lt;title&gt; tag or &lt;h1&gt; tag</p>
          <p><strong>Slug:</strong> Generated from filename (duplicates get -1, -2, etc.)</p>
          <p><strong>Content:</strong> Extracted from &lt;body&gt; content</p>
          <p><strong>Categories:</strong> Auto-assigned based on title keywords</p>
          <p><strong>Images:</strong> All images extracted and uploaded to media library</p>
          <p><strong>Status:</strong> Posts are published immediately with current date</p>
        </CardContent>
      </Card>
    </div>
  )
}
