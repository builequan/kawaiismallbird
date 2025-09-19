'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Play,
  Upload,
  Database,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Languages,
  Filter,
  Search,
  Eye,
  Download,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WebsiteInfo {
  id: string
  name: string
  articleCount: number
  languages: Array<{
    code: string
    count: number
  }>
}

interface Article {
  id: number
  title: string
  language: string
  category: string
  status: string
  publishedAt: string
  wordCount?: number
  selected: boolean
}

interface ImportStats {
  totalImported: number
  successCount: number
  failureCount: number
  duplicatesSkipped: number
}

const ContentImportManager: React.FC = () => {
  const [websites, setWebsites] = useState<WebsiteInfo[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importMessage, setImportMessage] = useState('')
  const [statistics, setStatistics] = useState<ImportStats | null>(null)
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { toast } = useToast()

  // Fetch websites on mount
  useEffect(() => {
    fetchWebsites()
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch articles when website, language or debounced search changes
  useEffect(() => {
    if (selectedWebsite) {
      fetchArticles()
    }
  }, [selectedWebsite, selectedLanguage, debouncedSearch])

  const fetchWebsites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/content-import/websites')
      if (!response.ok) throw new Error('Failed to fetch websites')

      const data = await response.json()
      setWebsites(data.websites)
    } catch (error) {
      console.error('Error fetching websites:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch websites. Please check database connection.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchArticles = async () => {
    if (!selectedWebsite) return

    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        websiteId: selectedWebsite,
        ...(selectedLanguage && { language: selectedLanguage }),
        ...(debouncedSearch && { search: debouncedSearch }),
      })

      const response = await fetch(`/api/content-import/articles?${params}`)
      if (!response.ok) throw new Error('Failed to fetch articles')

      const data = await response.json()
      setArticles(data.articles.map((a: Article) => ({ ...a, selected: false })))
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch articles.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(new Set(articles.map(a => a.id)))
      setArticles(articles.map(a => ({ ...a, selected: true })))
    } else {
      setSelectedArticles(new Set())
      setArticles(articles.map(a => ({ ...a, selected: false })))
    }
  }

  const handleSelectArticle = (articleId: number, checked: boolean) => {
    const newSelected = new Set(selectedArticles)
    if (checked) {
      newSelected.add(articleId)
    } else {
      newSelected.delete(articleId)
    }
    setSelectedArticles(newSelected)
    setArticles(articles.map(a =>
      a.id === articleId ? { ...a, selected: checked } : a
    ))
  }

  const handlePreviewArticle = async (article: Article) => {
    try {
      const response = await fetch('/api/content-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      })

      if (!response.ok) throw new Error('Failed to preview article')

      const data = await response.json()
      setPreviewArticle({ ...article, ...data })
    } catch (error) {
      console.error('Error previewing article:', error)
      toast({
        title: 'Error',
        description: 'Failed to preview article.',
        variant: 'destructive',
      })
    }
  }

  const handleImport = async () => {
    if (selectedArticles.size === 0) {
      toast({
        title: 'No articles selected',
        description: 'Please select at least one article to import.',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportMessage('Starting import...')

    try {
      const response = await fetch('/api/content-import/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: Array.from(selectedArticles),
          websiteId: selectedWebsite,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) throw new Error('Import failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                if (data.progress !== undefined) {
                  setImportProgress(data.progress)
                }
                if (data.message) {
                  setImportMessage(data.message)
                }
                if (data.complete) {
                  setStatistics(data.stats)
                  toast({
                    title: 'Import Complete',
                    description: `Successfully imported ${data.stats.successCount} articles.`,
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Refresh articles list
      fetchArticles()
    } catch (error) {
      console.error('Error during import:', error)
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
      setImportMessage('')
    }
  }

  const currentWebsite = websites.find(w => w.id === selectedWebsite)
  const availableLanguages = currentWebsite?.languages || []

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Database Import</h1>
              <p className="text-gray-600 mt-1">
                Import articles from the content creation database
              </p>
            </div>
            <Button
              onClick={fetchWebsites}
              variant="outline"
              className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              Total: {statistics.totalImported} | Success: {statistics.successCount} |
              Failed: {statistics.failureCount} | Duplicates: {statistics.duplicatesSkipped}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Website Selection Sidebar */}
          <div className="xl:col-span-1">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Select Website
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Choose a website to import from
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {websites.map((website) => (
                    <button
                      key={website.id}
                      onClick={() => setSelectedWebsite(website.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedWebsite === website.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{website.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Site ID: {website.id}</p>
                        </div>
                        <Badge className="bg-gray-100 text-gray-700">
                          {website.articleCount}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {website.languages.map((lang) => (
                          <Badge
                            key={lang.code}
                            variant="outline"
                            className="text-xs border-gray-300 text-gray-600"
                          >
                            {lang.code}: {lang.count}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {selectedWebsite ? (
              <>
                {/* Filters Bar */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Language Filter */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">Language</Label>
                        <Select value={selectedLanguage || 'all'} onValueChange={(value) => setSelectedLanguage(value === 'all' ? '' : value)}>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="All languages" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300 text-gray-900">
                            <SelectItem value="all" className="text-gray-900">All languages</SelectItem>
                            {availableLanguages.map(lang => (
                              <SelectItem key={lang.code} value={lang.code} className="text-gray-900">
                                <span>{lang.code === 'ja' ? 'Japanese' : 'English'} ({lang.count})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Search */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">Actions</Label>
                        <Button
                          onClick={handleImport}
                          disabled={selectedArticles.size === 0 || isImporting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import {selectedArticles.size > 0 && `(${selectedArticles.size})`}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Articles Table */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-900">Articles</CardTitle>
                        <CardDescription className="text-gray-600">
                          {articles.length} articles found {selectedLanguage && `(${selectedLanguage === 'en' ? 'English' : 'Japanese'} only)`} • {selectedArticles.size} selected
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedArticles.size === articles.length && articles.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="border-gray-300"
                        />
                        <Label htmlFor="select-all" className="text-gray-700 cursor-pointer">
                          Select All
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {articles.length > 0 ? (
                      <ScrollArea className="h-[600px]">
                        <Table>
                          <TableHeader className="bg-gray-50 sticky top-0">
                            <TableRow className="border-gray-200">
                              <TableHead className="w-12 text-gray-700"></TableHead>
                              <TableHead className="text-gray-700">Title</TableHead>
                              <TableHead className="text-gray-700">Language</TableHead>
                              <TableHead className="text-gray-700">Category</TableHead>
                              <TableHead className="text-gray-700">Status</TableHead>
                              <TableHead className="text-gray-700">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {articles.map(article => (
                              <TableRow key={article.id} className="border-gray-200 hover:bg-gray-50">
                                <TableCell>
                                  <Checkbox
                                    checked={article.selected}
                                    onCheckedChange={(checked) =>
                                      handleSelectArticle(article.id, checked as boolean)
                                    }
                                    className="border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-gray-900 max-w-md">
                                  <div className="truncate" title={article.title}>
                                    {article.title}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={article.language === 'ja' ? 'default' : 'secondary'}
                                    className={article.language === 'ja'
                                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-200'}
                                  >
                                    {article.language}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-700">{article.category}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={article.status === 'published' ? 'default' : 'outline'}
                                    className={article.status === 'published'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'border-gray-300 text-gray-600'}
                                  >
                                    {article.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handlePreviewArticle(article)}
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">
                          {isLoading ? 'Loading articles...' : 'No articles found'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardContent className="py-24 text-center">
                  <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a Website to Get Started
                  </h3>
                  <p className="text-gray-600">
                    Choose a website from the sidebar to view and import articles
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Import Progress Dialog */}
        <Dialog open={isImporting} onOpenChange={() => {}}>
          <DialogContent className="bg-white border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Importing Articles</DialogTitle>
              <DialogDescription className="text-gray-600">
                Please wait while articles are being imported...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress value={importProgress} className="bg-gray-200" />
              <p className="text-sm text-gray-600 text-center">
                {importMessage}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewArticle} onOpenChange={() => setPreviewArticle(null)}>
          <DialogContent className="max-w-3xl bg-white border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Article Preview</DialogTitle>
              <DialogDescription className="text-gray-600">
                Preview how this article will appear after import
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[500px] mt-4">
              {previewArticle && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Title</h3>
                    <p className="text-gray-900">{previewArticle.title}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Metadata</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Language: {previewArticle.language}</div>
                      <div>Category: {previewArticle.category}</div>
                      <div>Status: {previewArticle.status}</div>
                      <div>Published: {previewArticle.publishedAt}</div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ContentImportManager