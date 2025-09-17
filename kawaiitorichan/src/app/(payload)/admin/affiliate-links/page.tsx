'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  Trash2, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  FileText,
  TrendingUp,
  Loader2,
  Upload,
  Play,
  Download
} from 'lucide-react'

interface Statistics {
  totalProducts: number
  activeProducts: number
  postsWithLinks: number
  totalPosts: number
  totalLinks: number
  averageLinksPerPost: number
  coverage: string
  languageDistribution: {
    ja: number
    en: number
  }
}

export default function AffiliateLinksManager() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load statistics
  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/affiliate-links/statistics')
      const data = await response.json()
      if (data.success) {
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Process new posts
  const processNewPosts = async () => {
    if (processing) return
    
    setProcessing(true)
    setMessage({ type: 'info', text: 'Processing posts... This may take a few minutes.' })
    
    try {
      const response = await fetch('/api/affiliate-links/process-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 1000 }) // Process all posts
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.message}. Average: ${data.averageLinksPerPost} links per post.`
        })
        // Reload statistics
        await loadStatistics()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to process posts' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setProcessing(false)
    }
  }

  // Remove all links
  const removeAllLinks = async () => {
    if (!confirm('Are you sure you want to remove ALL affiliate links from all posts? This action cannot be undone.')) {
      return
    }
    
    setRemoving(true)
    setMessage({ type: 'info', text: 'Removing all links... Please wait.' })
    
    try {
      const response = await fetch('/api/affiliate-links/remove-all', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${data.message}`
        })
        // Reload statistics
        await loadStatistics()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove links' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setRemoving(false)
    }
  }

  // Import products from JSON file
  const importProducts = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a JSON file first' })
      return
    }
    
    setImporting(true)
    setMessage({ type: 'info', text: 'Importing products... Please wait.' })
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/affiliate-links/import', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Imported ${data.count} products successfully!`
        })
        setSelectedFile(null)
        await loadStatistics()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import products' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed. Please check the file format.' })
    } finally {
      setImporting(false)
    }
  }
  
  // Remove all products
  const removeAllProducts = async () => {
    if (!confirm('Are you sure you want to remove ALL products? This cannot be undone.')) {
      return
    }
    
    setLoading(true)
    setMessage({ type: 'info', text: 'Removing all products...' })
    
    try {
      const response = await fetch('/api/affiliate-links/products/remove-all', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ All products removed successfully!' })
        await loadStatistics()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove products' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Rebuild index (for initial setup)
  const rebuildIndex = async () => {
    if (!confirm('Rebuild the product index? This will scan all products and posts.')) {
      return
    }
    
    setLoading(true)
    setMessage({ type: 'info', text: 'Rebuilding index... This may take several minutes.' })
    
    try {
      const response = await fetch('/api/affiliate-links/rebuild', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: '✅ Index rebuilt successfully!'
        })
        await loadStatistics()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to rebuild index' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/json') {
      setSelectedFile(file)
      setMessage({ type: 'info', text: `Selected: ${file.name}` })
    } else {
      setMessage({ type: 'error', text: 'Please select a valid JSON file' })
    }
  }

  // Export links to CSV
  const exportLinksCSV = async () => {
    try {
      setLoading(true)
      setMessage({ type: 'info', text: 'Exporting CSV...' })
      
      const response = await fetch('/api/affiliate-links/export-csv', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to export CSV')
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/)
      const fileName = fileNameMatch ? fileNameMatch[1] : `affiliate-links-export-${new Date().toISOString().split('T')[0]}.csv`
      
      // Create a blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setMessage({
        type: 'success',
        text: `✅ CSV file exported successfully: ${fileName}`
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to export CSV file'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Affiliate Links Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage affiliate product links across your posts
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={`mb-6 ${
          message.type === 'success' ? 'border-green-500' : 
          message.type === 'error' ? 'border-red-500' : 
          'border-blue-500'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Active: {statistics?.activeProducts || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts with Links</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.postsWithLinks || 0} / {statistics?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">{statistics?.coverage || '0%'} coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalLinks || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg per post: {statistics?.averageLinksPerPost?.toFixed(1) || '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Language Distribution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              JA: {statistics?.languageDistribution?.ja || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              EN: {statistics?.languageDistribution?.en || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <p className="text-sm text-gray-600">Manage affiliate product links</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={processNewPosts}
              disabled={processing || removing}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Process New Posts
                </>
              )}
            </Button>

            <Button
              onClick={removeAllLinks}
              disabled={processing || removing}
              variant="destructive"
              size="lg"
            >
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove All Links
                </>
              )}
            </Button>

            <Button
              onClick={rebuildIndex}
              disabled={processing || removing || loading}
              variant="outline"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rebuild Index
                </>
              )}
            </Button>
          </div>

          {/* Product Management Section */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3">Product Management</h3>
            
            {/* File Import Section */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <Button
                  onClick={importProducts}
                  disabled={!selectedFile || importing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Products
                    </>
                  )}
                </Button>
              </div>
              {selectedFile && (
                <p className="text-xs text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            
            {/* Product Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={removeAllProducts}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove All Products
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/data/affiliate-links/products-index.json', '_blank')}
              >
                <Package className="mr-2 h-4 w-4" />
                View Products JSON
              </Button>
              
              <Button
                onClick={exportLinksCSV}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Links CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/admin/collections/affiliate-products'}
            >
              <Package className="mr-2 h-4 w-4" />
              Manage Products
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadStatistics()}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Affiliate Links Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              What the numbers mean:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-6">
              <li><strong>2 posts</strong> = This product can be linked in 2 different posts</li>
              <li><strong>Posts with Links: X/Y</strong> = X out of Y total posts have affiliate links</li>
              <li><strong>Total Links: 10</strong> = Total number of affiliate links across all posts</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-6">
              <li>Click <strong>"Rebuild Index"</strong> first - finds which products match your posts</li>
              <li>Click <strong>"Process New Posts"</strong> - adds affiliate links to posts (max 6 per post)</li>
              <li>Check your posts to see the new affiliate links!</li>
            </ol>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Links are added as product recommendations at the end of posts and as keyword replacements in the text.
              Each post will have maximum 6 affiliate links for optimal user experience.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}