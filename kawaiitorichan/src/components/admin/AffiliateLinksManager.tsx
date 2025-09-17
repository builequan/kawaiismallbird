'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { 
  RefreshCw, 
  Play, 
  Trash2, 
  Upload,
  BarChart3,
  Link,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  Globe,
  Database,
  FileX,
  FileJson,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import FileSelector from './FileSelector'

interface Statistics {
  products: {
    total: number
    active: number
    inactive: number
    japanese: number
    english: number
    both: number
  }
  posts: {
    total: number
    withAffiliateLinks: number
    withoutAffiliateLinks: number
    excluded: number
  }
  links: {
    total: number
    inline: number
    recommendations: number
    averagePerPost: string
  }
  topProducts: Array<{
    id: string
    name: string
    usageCount: number
  }>
}

interface ProcessingStatus {
  isProcessing: boolean
  currentStep?: string
  progress?: number
  message?: string
}

interface FileInfo {
  name: string
  path?: string
  size: number
  sizeFormatted: string
  dateModified: string
  dateFormatted: string
  productCount?: number
  source?: string
}

export default function AffiliateLinksManager() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ isProcessing: false })
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDeleteProductsDialog, setShowDeleteProductsDialog] = useState(false)
  
  // Debug logging for dialog state
  useEffect(() => {
    console.log('Delete dialog state:', showDeleteProductsDialog)
  }, [showDeleteProductsDialog])
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace' | 'smart'>('merge')
  const [deleteFileAfterImport, setDeleteFileAfterImport] = useState(false)
  const { toast } = useToast()

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affiliate-links/statistics', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch statistics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  // Handle file selection from FileSelector
  const handleFilesSelected = (files: FileInfo[]) => {
    setSelectedFiles(files)
  }

  // Export links to CSV
  const handleExportCSV = async () => {
    try {
      setProcessingStatus({ isProcessing: true, currentStep: 'Exporting CSV...' })
      
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
      
      toast({
        title: 'Export Successful',
        description: `CSV file downloaded: ${fileName}`,
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export affiliate links to CSV',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
    }
  }

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    setSelectedFile(file)
    setSelectedFiles([]) // Clear selected files from browser when uploading
  }

  // Import products from selected files or uploaded file
  const handleImport = async () => {
    // Check if we have files to import
    if (selectedFiles.length === 0 && !selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a JSON file to import',
        variant: 'destructive',
      })
      return
    }

    const importSource = selectedFile ? selectedFile.name : `${selectedFiles.length} file(s) from Downloads`
    const message = importStrategy === 'replace' 
      ? `Replace ALL products with data from ${importSource}? This will DELETE all existing products first!`
      : `Import affiliate products from ${importSource}? This may take a few minutes.`
    
    if (!confirm(message)) return
    
    setProcessingStatus({ isProcessing: true, currentStep: 'Preparing import...' })
    setSelectedAction('import')
    
    try {
      let allProducts: any[] = []
      const filesToDelete: string[] = []
      
      if (selectedFile) {
        // Handle uploaded file
        setProcessingStatus({ isProcessing: true, currentStep: 'Reading uploaded file...' })
        const fileContent = await selectedFile.text()
        const jsonData = JSON.parse(fileContent)
        
        if (Array.isArray(jsonData)) {
          allProducts = jsonData
        } else if (jsonData.products && Array.isArray(jsonData.products)) {
          allProducts = jsonData.products
        } else {
          throw new Error('Invalid JSON structure')
        }
      } else {
        // Handle files from Downloads folder
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          setProcessingStatus({ 
            isProcessing: true, 
            currentStep: `Reading file ${i + 1}/${selectedFiles.length}: ${file.name}...` 
          })
          
          // Fetch file content from server
          const response = await fetch(`/api/affiliate-links/read-file?name=${encodeURIComponent(file.name)}`, {
            credentials: 'include',
          })
          
          if (!response.ok) throw new Error(`Failed to read file: ${file.name}`)
          
          const jsonData = await response.json()
          let products: any[] = []
          
          if (Array.isArray(jsonData)) {
            products = jsonData
          } else if (jsonData.products && Array.isArray(jsonData.products)) {
            products = jsonData.products
          }
          
          allProducts.push(...products)
          
          if (deleteFileAfterImport) {
            filesToDelete.push(file.name)
          }
        }
      }
      
      setProcessingStatus({ isProcessing: true, currentStep: `Importing ${allProducts.length} products (${importStrategy} mode)...` })
      
      // Send to API with strategy
      const response = await fetch('/api/affiliate-links/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          products: allProducts,
          strategy: importStrategy,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Import failed')
      }
      
      const result = await response.json()
      
      // Delete files if requested
      if (deleteFileAfterImport && filesToDelete.length > 0) {
        setProcessingStatus({ isProcessing: true, currentStep: 'Cleaning up import files...' })
        await fetch('/api/affiliate-links/delete-files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ files: filesToDelete }),
        })
      }
      
      toast({
        title: 'Import Complete',
        description: result.message || `Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
      })
      
      setShowImportDialog(false)
      setSelectedFile(null)
      setSelectedFiles([])
      await fetchStatistics()
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import affiliate products',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
      setSelectedAction('')
    }
  }

  // Delete all products
  const handleDeleteAllProducts = async () => {
    if (!confirm('Delete ALL affiliate products? This will remove all products and their links from posts.')) return
    
    if (!confirm('Are you SURE? This action cannot be undone!')) return
    
    setProcessingStatus({ isProcessing: true, currentStep: 'Deleting all products...' })
    setSelectedAction('delete')
    
    try {
      const response = await fetch('/api/affiliate-links/delete-products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deleteAll: true }),
      })
      
      if (!response.ok) throw new Error('Delete failed')
      
      const result = await response.json()
      toast({
        title: 'Products Deleted',
        description: result.message || `Deleted ${result.deletedCount} products`,
      })
      
      setShowDeleteProductsDialog(false)
      await fetchStatistics()
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete products',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
      setSelectedAction('')
    }
  }

  // Rebuild index
  const handleRebuildIndex = async () => {
    if (!confirm('Rebuild affiliate product index? This will reprocess all products and posts.')) return
    
    setProcessingStatus({ isProcessing: true, currentStep: 'Building index...' })
    setSelectedAction('rebuild')
    
    try {
      const response = await fetch('/api/affiliate-links/rebuild', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) throw new Error('Rebuild failed')
      
      const result = await response.json()
      toast({
        title: 'Index Rebuilt',
        description: `Processed ${result.products} products and ${result.posts} posts`,
      })
      
      await fetchStatistics()
    } catch (error) {
      toast({
        title: 'Rebuild Failed',
        description: 'Failed to rebuild index',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
      setSelectedAction('')
    }
  }

  // Process posts
  const handleProcessPosts = async (all: boolean = false) => {
    const message = all 
      ? 'Apply affiliate links to ALL posts? This will add product recommendations and keyword links to your articles.' 
      : 'Apply affiliate links to posts without links? This will add product recommendations and keyword links to your articles.'
    
    if (!confirm(message)) return
    
    setProcessingStatus({ 
      isProcessing: true, 
      currentStep: 'Finding matching products for each post...',
      progress: 0
    })
    setSelectedAction('process')
    
    try {
      // Step 1: Check if index exists
      setProcessingStatus({ 
        isProcessing: true, 
        currentStep: 'Checking product index...',
        progress: 10
      })
      
      const response = await fetch('/api/affiliate-links/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all }),
      })
      
      if (!response.ok) throw new Error('Processing failed')
      
      const result = await response.json()
      
      setProcessingStatus({ 
        isProcessing: true, 
        currentStep: 'Updating statistics...',
        progress: 90
      })
      
      await fetchStatistics()
      
      // Show detailed results
      toast({
        title: '✅ Affiliate Links Applied Successfully!',
        description: (
          <div className="space-y-1">
            <div>📝 Posts processed: {result.processed}</div>
            <div>🔗 Links will appear as:</div>
            <div className="text-xs pl-4">• Product recommendations at end of posts</div>
            <div className="text-xs pl-4">• Inline keyword replacements (if keywords match)</div>
            {result.skipped > 0 && <div>⏭️ Skipped (already have links): {result.skipped}</div>}
          </div>
        ) as any,
      })
      
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to apply affiliate links. Try rebuilding the index first.',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
      setSelectedAction('')
    }
  }

  // Remove all affiliate links
  const handleRemoveAll = async () => {
    if (!confirm('Remove ALL affiliate links from posts? This action cannot be undone.')) return
    
    setProcessingStatus({ isProcessing: true, currentStep: 'Removing links...' })
    setSelectedAction('remove')
    
    try {
      const response = await fetch('/api/affiliate-links/remove', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) throw new Error('Removal failed')
      
      const result = await response.json()
      toast({
        title: 'Links Removed',
        description: `Removed links from ${result.processed} posts`,
      })
      
      await fetchStatistics()
    } catch (error) {
      toast({
        title: 'Removal Failed',
        description: 'Failed to remove affiliate links',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
      setSelectedAction('')
    }
  }


  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading affiliate link statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Links Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage affiliate product links across your posts
          </p>
        </div>
        <Button onClick={fetchStatistics} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Processing Status */}
      {processingStatus.isProcessing && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-medium">{processingStatus.currentStep || 'Processing...'}</span>
            </div>
            {processingStatus.progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingStatus.progress}%` }}
                />
              </div>
            )}
            {processingStatus.message && (
              <div className="text-sm text-gray-600 mt-2">{processingStatus.message}</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.products.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Active: {statistics?.products.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts with Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.posts.withAffiliateLinks || 0} / {statistics?.posts.total || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {statistics?.posts.total ? 
                Math.round((statistics.posts.withAffiliateLinks / statistics.posts.total) * 100) : 0}% coverage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Link className="w-4 h-4" />
              Total Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.links.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg per post: {statistics?.links.averagePerPost || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="secondary">JA: {statistics?.products.japanese || 0}</Badge>
              <Badge variant="secondary">EN: {statistics?.products.english || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage affiliate product links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowImportDialog(true)}
              disabled={processingStatus.isProcessing}
              variant="outline"
              className="justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Products
            </Button>
            
            <Button 
              onClick={handleRebuildIndex}
              disabled={processingStatus.isProcessing}
              variant="outline"
              className="justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rebuild Index
            </Button>
            
            <Button 
              onClick={() => handleProcessPosts(false)}
              disabled={processingStatus.isProcessing}
              className="justify-start"
            >
              <Play className="w-4 h-4 mr-2" />
              Process New Posts
            </Button>
            
            <Button 
              onClick={() => handleProcessPosts(true)}
              disabled={processingStatus.isProcessing}
              variant="secondary"
              className="justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reprocess All Posts
            </Button>
            
            <Button 
              onClick={handleRemoveAll}
              disabled={processingStatus.isProcessing}
              variant="destructive"
              className="justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove All Links
            </Button>
            
            <Button 
              onClick={() => {
                console.log('Delete button clicked, opening dialog...')
                setShowDeleteProductsDialog(true)
              }}
              disabled={processingStatus.isProcessing}
              variant="destructive"
              className="justify-start"
            >
              <Database className="w-4 h-4 mr-2" />
              Delete All Products
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            How Affiliate Links Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="font-medium">📚 What the numbers mean:</div>
            <ul className="text-sm space-y-1 ml-4">
              <li>• <strong>2 posts</strong> = This product can be linked in 2 different posts</li>
              <li>• <strong>Posts with Links: 2/80</strong> = 2 out of 80 posts have affiliate links</li>
              <li>• <strong>Total Links: 10</strong> = Total number of affiliate links across all posts</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="font-medium">🔄 How to use:</div>
            <ol className="text-sm space-y-1 ml-4">
              <li>1. Click <strong>"Rebuild Index"</strong> first - finds which products match your posts</li>
              <li>2. Click <strong>"Process New Posts"</strong> - adds affiliate links to posts</li>
              <li>3. Check your posts to see the new affiliate links!</li>
            </ol>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            💡 Links are added as product recommendations at the end of posts and as keyword replacements in the text.
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      {statistics?.topProducts && statistics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Performing Products
            </CardTitle>
            <CardDescription>Products that match the most posts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="text-sm truncate max-w-md">{product.name}</span>
                  </div>
                  <Badge variant="secondary">{product.usageCount} posts can link to this</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Link Distribution
          </CardTitle>
          <CardDescription>Breakdown of affiliate link types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Inline Links</span>
              <Badge variant="secondary">{statistics?.links.inline || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Recommendation Links</span>
              <Badge variant="secondary">{statistics?.links.recommendations || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Posts Excluded</span>
              <Badge variant="outline">{statistics?.posts.excluded || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open)
        if (!open) {
          setSelectedFiles([])
          setSelectedFile(null)
          setImportStrategy('merge')
          setDeleteFileAfterImport(false)
        }
      }}>
        <DialogContent 
          className="sm:max-w-[750px] max-h-[90vh] overflow-visible" 
          onEscapeKeyDown={() => setShowImportDialog(false)}
        >
          <DialogHeader>
            <DialogTitle>Import Affiliate Products</DialogTitle>
            <DialogDescription>
              Select JSON files from Downloads folder or upload your own
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <FileSelector
              onFileSelect={handleFilesSelected}
              onFileUpload={handleFileUpload}
              multiSelect={true}
              allowDelete={true}
              filter="affiliate"
            />
            
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Import Strategy</Label>
                  <Select value={importStrategy} onValueChange={(value: any) => setImportStrategy(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">Merge (Update existing)</SelectItem>
                      <SelectItem value="replace">Replace All</SelectItem>
                      <SelectItem value="smart">Smart Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setShowImportDialog(false)
                      setSelectedFiles([])
                      setSelectedFile(null)
                    }}
                    disabled={processingStatus.isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={handleImport}
                    disabled={processingStatus.isProcessing || (selectedFiles.length === 0 && !selectedFile)}
                    variant={importStrategy === 'replace' ? 'destructive' : 'default'}
                  >
                    {processingStatus.isProcessing ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Importing
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {(selectedFiles.length > 0 || selectedFile) && (
                <>
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="delete-after-import"
                        checked={deleteFileAfterImport}
                        onCheckedChange={(checked) => setDeleteFileAfterImport(checked as boolean)}
                        className="h-3 w-3"
                      />
                      <Label htmlFor="delete-after-import" className="text-xs cursor-pointer">
                        Delete file(s) from Downloads after import
                      </Label>
                    </div>
                  )}
                  
                  {selectedFile && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ✓ Ready: {selectedFile.name}
                    </div>
                  )}
                  
                  {selectedFiles.length > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ✓ {selectedFiles.length} file(s) selected from Downloads
                    </div>
                  )}
                  
                  {importStrategy === 'replace' && (
                    <div className="text-xs text-destructive">
                      ⚠️ Will delete all existing products first!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Products Dialog - Simplified for testing */}
      {showDeleteProductsDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteProductsDialog(false)} />
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete All Products</h2>
            <p className="mb-4">This will permanently delete all {statistics?.products.total || 0} affiliate products from the database.</p>
            
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone!
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteProductsDialog(false)}
                disabled={processingStatus.isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAllProducts}
                disabled={processingStatus.isProcessing}
              >
                {processingStatus.isProcessing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}