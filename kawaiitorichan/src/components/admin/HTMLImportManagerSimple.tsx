'use client'

import React, { useState, useRef } from 'react'

const HTMLImportManagerSimple: React.FC = () => {
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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        HTML Bulk Upload
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Upload HTML files to automatically create blog posts
      </p>

      <div
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          marginBottom: '2rem',
        }}
      >
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Select HTML files to upload
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".html,.htm"
          onChange={handleFileSelect}
          style={{ marginBottom: '1rem' }}
        />
        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p>{selectedFiles.length} file(s) selected</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload & Convert'}
              </button>
              <button
                onClick={handleClear}
                disabled={isUploading}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1,
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && !results && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Selected Files:</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '2rem' }}>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Upload Results
          </h2>

          {results.summary && (
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <p>Total: {results.summary.total}</p>
              <p style={{ color: '#059669' }}>Successful: {results.summary.successful}</p>
              <p style={{ color: '#dc2626' }}>Failed: {results.summary.failed}</p>
              {results.summary.warnings > 0 && (
                <p style={{ color: '#f59e0b' }}>Warnings: {results.summary.warnings}</p>
              )}
            </div>
          )}

          {results.results?.success?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#059669', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ✓ Successfully Imported ({results.results.success.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Filename</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Title</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Slug</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Categories</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.success.map((result: any, index: number) => (
                    <tr key={index}>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>{result.filename}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>{result.title}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>{result.slug}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>
                        {result.categories?.join(', ') || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.results?.failed?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ✗ Failed ({results.results.failed.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Filename</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.failed.map((result: any, index: number) => (
                    <tr key={index}>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb' }}>{result.filename}</td>
                      <td style={{ padding: '0.5rem', border: '1px solid #e5e7eb', color: '#dc2626' }}>
                        {result.error}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.results?.warnings?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ⚠ Warnings ({results.results.warnings.length})
              </h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '2rem' }}>
                {results.results.warnings.map((warning: any, index: number) => (
                  <li key={index} style={{ color: '#92400e' }}>
                    <strong>{warning.filename}:</strong> {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1e40af' }}>How it works</h3>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', color: '#1e3a8a' }}>
          <li><strong>Title:</strong> Extracted from &lt;title&gt; tag or &lt;h1&gt; tag</li>
          <li><strong>Slug:</strong> Generated from filename (duplicates get -1, -2, etc.)</li>
          <li><strong>Content:</strong> Extracted from &lt;body&gt; content</li>
          <li><strong>Categories:</strong> Auto-assigned based on title keywords</li>
          <li><strong>Images:</strong> All images extracted and uploaded to media library</li>
          <li><strong>Status:</strong> Posts are published immediately with current date</li>
        </ul>
      </div>
    </div>
  )
}

export default HTMLImportManagerSimple
