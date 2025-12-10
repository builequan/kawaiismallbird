'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RefreshCw,
  Play,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle,
  Globe,
  Sparkles,
  Database,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Statistics {
  terms: {
    total: number
    bySource: {
      wikipedia: number
      llm: number
    }
    byCategory: Record<string, number>
  }
  posts: {
    total: number
    withTerms: number
    withoutTerms: number
    coverage: number
  }
  averageTermsPerPost: string
  recentTerms: Array<{
    term: string
    reading: string
    source: string
    createdAt: string
  }>
}

interface ProcessingStatus {
  isProcessing: boolean
  currentStep?: string
  progress?: number
}

export default function GlossaryManager() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({ isProcessing: false })
  const { toast } = useToast()

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/glossary/statistics', {
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

  // Process new posts (posts without glossary terms)
  const handleProcessNewPosts = async () => {
    if (!confirm('Extract glossary terms from posts without terms? This may take several minutes.')) return

    setProcessingStatus({
      isProcessing: true,
      currentStep: 'Finding posts without glossary terms...',
      progress: 0,
    })

    try {
      // Get posts without terms
      const response = await fetch('/api/glossary/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: false, batchSize: 5 }),
      })

      if (!response.ok) throw new Error('Processing failed')

      const result = await response.json()

      toast({
        title: 'Glossary Updated',
        description: `New terms: ${result.stats?.newTerms || 0}, Linked: ${result.stats?.linkedTerms || 0}`,
      })

      await fetchStatistics()
    } catch (error: any) {
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process posts',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
    }
  }

  // Process all posts
  const handleProcessAllPosts = async () => {
    if (!confirm('Process ALL posts? This will take a long time for ~300 posts (15-30 minutes). Continue?')) return

    setProcessingStatus({
      isProcessing: true,
      currentStep: 'Processing all posts...',
      progress: 0,
    })

    try {
      const response = await fetch('/api/glossary/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true, batchSize: 10 }),
      })

      if (!response.ok) throw new Error('Processing failed')

      const result = await response.json()

      toast({
        title: 'Glossary Updated',
        description: `Processed ${result.stats?.processed || 0} posts. New terms: ${result.stats?.newTerms || 0}`,
      })

      await fetchStatistics()
    } catch (error: any) {
      toast({
        title: 'Processing Failed',
        description: error.message || 'Failed to process posts',
        variant: 'destructive',
      })
    } finally {
      setProcessingStatus({ isProcessing: false })
    }
  }

  // Category labels in Japanese
  const categoryLabels: Record<string, string> = {
    'bird-species': '鳥の種類',
    'bird-care': '鳥の飼育',
    'bird-anatomy': '鳥の体',
    'bird-behavior': '鳥の行動',
    'equipment': '用品',
    'food': '餌・食べ物',
    'health': '健康',
    'general': '一般',
  }

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading glossary statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Glossary Manager</h1>
          <p className="text-muted-foreground mt-2">
            用語集の管理 - Manage Japanese glossary terms from posts
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
            {processingStatus.progress !== undefined && processingStatus.progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingStatus.progress}%` }}
                />
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Total Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.terms.total || 0}</div>
            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Wiki: {statistics?.terms.bySource.wikipedia || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                LLM: {statistics?.terms.bySource.llm || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Posts Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.posts.withTerms || 0} / {statistics?.posts.total || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {statistics?.posts.coverage || 0}% coverage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Avg Terms/Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.averageTermsPerPost || '0'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              terms per post
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Posts Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.posts.withoutTerms || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              posts without terms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Extract and manage glossary terms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={handleProcessNewPosts}
              disabled={processingStatus.isProcessing}
              className="justify-start"
            >
              <Play className="w-4 h-4 mr-2" />
              Process New Posts
            </Button>

            <Button
              onClick={handleProcessAllPosts}
              disabled={processingStatus.isProcessing}
              variant="secondary"
              className="justify-start"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reprocess All Posts
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open('/glossary', '_blank')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View Glossary Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            How the Glossary Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="font-medium">Processing Steps:</div>
            <ol className="text-sm space-y-1 ml-4 list-decimal">
              <li>Extract Japanese terms from post content using Claude Haiku</li>
              <li>Check Japanese Wikipedia for definitions</li>
              <li>If not found, generate definitions using LLM</li>
              <li>Store in glossary collection with readings for sorting</li>
            </ol>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Term Categories:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {label}: {statistics?.terms.byCategory[key] || 0}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Terms are displayed as tooltips when users hover over them in post content.
          </div>
        </CardContent>
      </Card>

      {/* Recent Terms */}
      {statistics?.recentTerms && statistics.recentTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recently Added Terms
            </CardTitle>
            <CardDescription>Latest glossary entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.recentTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{term.term}</span>
                    <span className="text-sm text-muted-foreground">({term.reading})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={term.source === 'wikipedia' ? 'default' : 'secondary'}>
                      {term.source === 'wikipedia' ? (
                        <><Globe className="w-3 h-3 mr-1" /> Wikipedia</>
                      ) : (
                        <><Sparkles className="w-3 h-3 mr-1" /> LLM</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
