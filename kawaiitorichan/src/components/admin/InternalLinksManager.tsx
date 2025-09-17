'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Play,
  Trash2,
  Settings,
  BarChart3,
  Link,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  FileX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Statistics {
  overview: {
    totalPosts: number
    postsWithLinks: number
    postsWithoutLinks: number
    totalLinks: number
    averageLinksPerPost: string
    linkCoverage: string
  }
  distribution: {
    '0': number
    '1-2': number
    '3-4': number
    '5+': number
  }
  topAnchorTexts: Array<{ text: string; count: number }>
  mostLinkedPosts: Array<{ id: string; title: string; linkCount: number }>
}

interface PostStatus {
  id: string
  title: string
  slug: string
  linkCount: number
  status: 'linked' | 'unlinked'
  lastProcessed: string | null
}

export default function InternalLinksManager() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [posts, setPosts] = useState<PostStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/internal-links/statistics', {
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
    }
  }

  // Fetch post status
  const fetchPostStatus = async () => {
    try {
      const response = await fetch(`/api/internal-links/status?page=${currentPage}&filter=${filter}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch post status')
      const data = await response.json()
      setPosts(data.posts)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch post status',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchStatistics(), fetchPostStatus()]).finally(() => setLoading(false))
  }, [currentPage, filter])

  // Rebuild index
  const handleRebuildIndex = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/internal-links/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          rebuildIndex: true,
          generateEmbeddings: true,
          computeSimilarity: true,
          applyLinks: false
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Rebuild failed:', errorData)
        throw new Error(errorData?.error || 'Failed to rebuild index')
      }
      
      const result = await response.json()
      console.log('Rebuild result:', result)
      
      toast({
        title: 'Success',
        description: result.message || 'Index rebuilt successfully',
      })
      
      await Promise.all([fetchStatistics(), fetchPostStatus()])
    } catch (error: any) {
      console.error('Rebuild error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to rebuild index',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Process selected posts
  const handleProcessPosts = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/internal-links/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postIds: selectedPosts.length > 0 ? selectedPosts : undefined,
          all: selectedPosts.length === 0
        })
      })
      
      if (!response.ok) throw new Error('Failed to process posts')
      
      const result = await response.json()
      toast({
        title: 'Success',
        description: `Processed ${result.stats.processed} posts`,
      })
      
      setSelectedPosts([])
      await Promise.all([fetchStatistics(), fetchPostStatus()])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process posts',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Remove links from selected posts
  const handleRemoveLinks = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/internal-links/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          postIds: selectedPosts.length > 0 ? selectedPosts : undefined,
          all: selectedPosts.length === 0
        })
      })
      
      if (!response.ok) throw new Error('Failed to remove links')
      
      const result = await response.json()
      toast({
        title: 'Success',
        description: 'Links removed successfully',
      })
      
      setSelectedPosts([])
      await Promise.all([fetchStatistics(), fetchPostStatus()])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove links',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Remove ALL links from ALL posts
  const handleRemoveAllLinks = async () => {
    if (!window.confirm('Are you sure you want to remove ALL internal links from ALL posts? This action cannot be undone.')) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/internal-links/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          all: true
        })
      })

      if (!response.ok) throw new Error('Failed to remove all links')

      const result = await response.json()
      toast({
        title: 'Success',
        description: `All internal links removed from ${result.stats?.removed || 0} posts`,
      })

      setSelectedPosts([])
      await Promise.all([fetchStatistics(), fetchPostStatus()])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove all links',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  // Remove reference sections from all posts
  const handleRemoveReferenceSections = async () => {
    if (!window.confirm('Are you sure you want to remove reference sections (出典・参考文献) from ALL posts? This will clean up duplicate references.')) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/internal-links/remove-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove reference sections')
      }

      const result = await response.json()
      toast({
        title: 'Success',
        description: `Reference sections removed from ${result.updated} posts`,
      })

      await Promise.all([fetchStatistics(), fetchPostStatus()])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove reference sections',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Internal Links Manager</h1>
        <p className="text-gray-600">Manage and monitor internal links across your posts</p>
      </div>

      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.overview.totalPosts}</div>
              <p className="text-xs text-gray-500">In database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Posts with Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.overview.postsWithLinks}</div>
              <Badge variant="outline" className="mt-1">
                {statistics.overview.linkCoverage}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.overview.totalLinks}</div>
              <p className="text-xs text-gray-500">Avg: {statistics.overview.averageLinksPerPost}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unlinked Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.overview.postsWithoutLinks}</div>
              <p className="text-xs text-gray-500">Need processing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <Button
          onClick={handleRebuildIndex}
          disabled={processing}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Rebuild Index
        </Button>

        <Button
          onClick={handleProcessPosts}
          disabled={processing}
        >
          <Play className="mr-2 h-4 w-4" />
          Process {selectedPosts.length > 0 ? 'Selected' : 'All'} Posts
        </Button>

        <Button
          onClick={handleRemoveLinks}
          disabled={processing || selectedPosts.length === 0}
          variant="destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Selected Links
        </Button>

        <Button
          onClick={handleRemoveAllLinks}
          disabled={processing}
          variant="destructive"
          className="ml-auto"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Remove ALL Links
        </Button>

        <Button
          onClick={handleRemoveReferenceSections}
          disabled={processing}
          variant="secondary"
          className="ml-2"
        >
          <FileX className="mr-2 h-4 w-4" />
          Clean Reference Sections
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Posts
        </Button>
        <Button
          variant={filter === 'linked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('linked')}
        >
          <Link className="mr-2 h-4 w-4" />
          Linked
        </Button>
        <Button
          variant={filter === 'unlinked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unlinked')}
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          Unlinked
        </Button>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            {selectedPosts.length > 0 && `${selectedPosts.length} posts selected`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts(posts.map(p => p.id))
                        } else {
                          setSelectedPosts([])
                        }
                      }}
                      checked={selectedPosts.length === posts.length && posts.length > 0}
                    />
                  </th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Links</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Processed</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPosts([...selectedPosts, post.id])
                          } else {
                            setSelectedPosts(selectedPosts.filter(id => id !== post.id))
                          }
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-gray-500">{post.slug}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary">{post.linkCount}</Badge>
                    </td>
                    <td className="p-2">
                      {post.status === 'linked' ? (
                        <Badge variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Linked
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Unlinked
                        </Badge>
                      )}
                    </td>
                    <td className="p-2 text-sm text-gray-500">
                      {post.lastProcessed ? (
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(post.lastProcessed).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Link Distribution */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Link Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>0 links:</span>
                  <Badge variant="outline">{statistics.distribution['0']} posts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>1-2 links:</span>
                  <Badge variant="outline">{statistics.distribution['1-2']} posts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>3-4 links:</span>
                  <Badge variant="outline">{statistics.distribution['3-4']} posts</Badge>
                </div>
                <div className="flex justify-between">
                  <span>5+ links:</span>
                  <Badge variant="outline">{statistics.distribution['5+']} posts</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Top Anchor Texts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.topAnchorTexts.slice(0, 5).map((anchor, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate">{anchor.text}</span>
                    <Badge variant="secondary">{anchor.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}