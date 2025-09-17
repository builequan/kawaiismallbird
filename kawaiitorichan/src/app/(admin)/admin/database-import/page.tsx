'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Database,
  FileText,
  Filter,
  Globe,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  Tag,
  User,
  Image,
  Hash
} from 'lucide-react';

interface DatabaseProfile {
  id: string;
  name: string;
  description: string;
}

interface DatabaseStats {
  totalArticles: number;
  websites: Array<{ id: string | number; count: number }>;
  languages: Array<{ language: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
}

interface Article {
  id: string | number;
  title: string;
  language: string;
  category?: string;
  author?: string;
  status?: string;
  created_at?: string;
  word_count?: number;
  has_images?: boolean;
  importStatus?: 'new' | 'imported' | 'updated' | 'error';
  importedAt?: string;
  payloadId?: string;
}

interface SiteConfig {
  name: string;
  description: string;
  primaryLanguage: string;
  url: string;
}

export default function DatabaseImportPage() {
  const [databases, setDatabases] = useState<DatabaseProfile[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'completed' | 'failed'>('idle');
  const [activeTab, setActiveTab] = useState<string>('select');
  const [siteConfigs, setSiteConfigs] = useState<Record<string, SiteConfig>>({});
  const [siteLanguages, setSiteLanguages] = useState<Array<{ language: string; count: number }>>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    author: '',
    status: '',
    hasImages: undefined as boolean | undefined,
    importStatus: '' as '' | 'new' | 'imported' | 'updated',
  });

  // Load database profiles and site configs
  useEffect(() => {
    loadDatabaseProfiles();
    loadSiteConfigs();
  }, []);

  // Auto-select first database if only one available
  useEffect(() => {
    if (databases.length === 1 && !selectedDatabase) {
      setSelectedDatabase(databases[0].id);
    }
  }, [databases, selectedDatabase]);

  const loadSiteConfigs = async () => {
    try {
      const response = await fetch('/api/database-import/site-config');
      const data = await response.json();
      if (data.sites) {
        setSiteConfigs(data.sites);
      }
    } catch (error) {
      console.error('Failed to load site configs:', error);
      // Fallback to default site names
      setSiteConfigs({
        '15': { name: 'Golf Blog JP', description: 'Japanese golf blog', primaryLanguage: 'ja', url: '' },
        '17': { name: 'Golf Tips EN', description: 'English golf tips', primaryLanguage: 'en', url: '' },
        '18': { name: 'Golf Academy', description: 'Golf training content', primaryLanguage: 'en', url: '' },
        '19': { name: 'Golf Masters', description: 'Professional golf content', primaryLanguage: 'ja', url: '' },
      });
    }
  };

  const loadDatabaseProfiles = async () => {
    try {
      const response = await fetch('/api/database-import/databases');
      const data = await response.json();
      setDatabases(data.profiles || []);
    } catch (error) {
      console.error('Failed to load database profiles:', error);
      // Fallback to hardcoded profiles for now
      setDatabases([
        {
          id: 'content_creation_db',
          name: 'Content Creation Database',
          description: 'Main content creation database'
        }
      ]);
    }
  };

  const testConnection = async () => {
    if (!selectedDatabase) return;

    setConnectionStatus('testing');
    try {
      const response = await fetch(`/api/database-import/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: selectedDatabase }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        loadDatabaseStats();
        // Automatically move to the next tab after successful connection
        setActiveTab('filter');
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      setConnectionStatus('failed');
    }
  };

  const loadDatabaseStats = async () => {
    if (!selectedDatabase) return;

    try {
      const response = await fetch(`/api/database-import/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: selectedDatabase }),
      });

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSiteLanguages = async (websiteId: string) => {
    if (!selectedDatabase || !websiteId) return;

    try {
      const response = await fetch(`/api/database-import/site-languages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDatabase,
          websiteId: websiteId
        }),
      });

      const data = await response.json();
      setSiteLanguages(data.languages || []);
    } catch (error) {
      console.error('Failed to load site languages:', error);
      setSiteLanguages([]);
    }
  };

  const checkImportStatus = async (articleList: Article[]) => {
    if (!selectedWebsite || articleList.length === 0) return articleList;

    try {
      const articleIds = articleList.map(a => a.id);
      const response = await fetch('/api/database-import/check-imported', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds,
          websiteId: selectedWebsite,
        }),
      });

      const data = await response.json();
      if (data.success && data.statuses) {
        // Map import status to articles
        const statusMap = new Map(
          data.statuses.map((s: any) => [
            s.articleId,
            {
              importStatus: s.hasUpdates ? 'updated' : s.status,
              importedAt: s.importedAt,
              payloadId: s.payloadId,
            },
          ])
        );

        return articleList.map(article => ({
          ...article,
          importStatus: statusMap.get(article.id)?.importStatus || 'new',
          importedAt: statusMap.get(article.id)?.importedAt,
          payloadId: statusMap.get(article.id)?.payloadId,
        }));
      }
    } catch (error) {
      console.error('Failed to check import status:', error);
    }

    return articleList;
  };

  const loadArticles = async () => {
    if (!selectedDatabase) return;

    setLoading(true);
    try {
      const response = await fetch('/api/database-import/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDatabase,
          websiteId: selectedWebsite,
          language: selectedLanguage,
          filters,
        }),
      });

      const data = await response.json();
      let articleList = data.articles || [];

      // Check import status for all articles
      if (selectedWebsite) {
        articleList = await checkImportStatus(articleList);
      }

      // Apply import status filter if set
      if (filters.importStatus) {
        articleList = articleList.filter((a: Article) => a.importStatus === filters.importStatus);
      }

      setArticles(articleList);

      // If articles loaded successfully, move to preview tab
      if (articleList.length > 0) {
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArticleSelection = (id: string | number) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedArticles(newSelection);
  };

  const selectAll = () => {
    setSelectedArticles(new Set(articles.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedArticles(new Set());
  };

  const startImport = async () => {
    if (selectedArticles.size === 0) return;

    setImportStatus('importing');
    setImportProgress(0);

    try {
      const response = await fetch('/api/database-import/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: selectedDatabase,
          websiteId: selectedWebsite,
          language: selectedLanguage,
          articleIds: Array.from(selectedArticles),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImportStatus('completed');
        setImportProgress(100);
      } else {
        setImportStatus('failed');
      }
    } catch (error) {
      setImportStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Database Import</h1>
          <p className="text-gray-600">Import articles from external databases into Payload CMS</p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white border">
          <TabsTrigger value="select" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            1. Select Database
          </TabsTrigger>
          <TabsTrigger value="filter" disabled={connectionStatus !== 'connected'} className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            2. Filter Articles
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={articles.length === 0} className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            3. Preview & Select
          </TabsTrigger>
          <TabsTrigger value="import" disabled={selectedArticles.size === 0} className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            4. Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Select Database</CardTitle>
              <CardDescription className="text-gray-600">Choose a database profile to import from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="database" className="text-gray-700 font-medium">Database Profile</Label>
                <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select a database" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {databases.map(db => (
                      <SelectItem key={db.id} value={db.id} className="text-gray-900 hover:bg-gray-100">
                        {db.name} - {db.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={testConnection}
                disabled={!selectedDatabase || connectionStatus === 'testing'}
              >
                {connectionStatus === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>

              {connectionStatus === 'connected' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Connected</AlertTitle>
                  <AlertDescription>Successfully connected to the database</AlertDescription>
                </Alert>
              )}

              {connectionStatus === 'failed' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription>Could not connect to the database. Please check your settings.</AlertDescription>
                </Alert>
              )}

              {stats && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.totalArticles || 0}</div>
                        <div className="text-sm text-gray-600">Total Articles</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.websites?.length || 0}</div>
                        <div className="text-sm text-gray-600">Websites</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.languages?.length || 0}</div>
                        <div className="text-sm text-gray-600">Languages</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{stats.categories?.length || 0}</div>
                        <div className="text-sm text-gray-600">Categories</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setActiveTab('filter')} size="lg">
                      Next: Filter Articles →
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Filter Articles</CardTitle>
              <CardDescription className="text-gray-600">Select website, language and apply filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">1. Select Website</Label>
                  <Select value={selectedWebsite || 'all'} onValueChange={(value) => {
                    const newWebsite = value === 'all' ? '' : value;
                    setSelectedWebsite(newWebsite);
                    // Reset language when website changes
                    setSelectedLanguage('');
                    // Load languages for this specific website
                    if (newWebsite) {
                      loadSiteLanguages(newWebsite);
                    } else {
                      setSiteLanguages([]);
                    }
                  }}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select a website to import from" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All websites</SelectItem>
                      {stats?.websites.map(w => {
                        const siteId = String(w.id);
                        const siteConfig = siteConfigs[siteId];
                        const siteName = siteConfig?.name || `Website ${w.id}`;
                        return (
                          <SelectItem key={w.id} value={siteId} className="text-gray-900 hover:bg-gray-100">
                            {siteName} (ID: {w.id}) - {w.count} articles
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedWebsite && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {siteConfigs[selectedWebsite]?.name || `Website ${selectedWebsite}`}
                    </p>
                  )}
                </div>

                {selectedWebsite && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">2. Select Language (Optional)</Label>
                    <Select value={selectedLanguage || 'all'} onValueChange={(value) => setSelectedLanguage(value === 'all' ? '' : value)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue placeholder="All languages" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All languages</SelectItem>
                        {siteLanguages.map(l => (
                          <SelectItem key={l.language} value={l.language} className="text-gray-900 hover:bg-gray-100">
                            {l.language === 'ja' ? 'Japanese (ja)' : l.language === 'en' ? 'English (en)' : l.language === 'english' ? 'English' : l.language} - {l.count} articles
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {siteLanguages.length === 0 && (
                      <p className="text-sm text-gray-500">Loading languages...</p>
                    )}
                  </div>
                )}
              </div>

              {selectedWebsite && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">3. Additional Filters (Optional)</h3>

                    <div className="space-y-2 mb-4">
                      <Label className="text-gray-700 font-medium">Search</Label>
                      <Input
                        placeholder="Search in title and content..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="bg-white border-gray-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Category</Label>
                  <Select
                    value={filters.category || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All categories</SelectItem>
                      {stats?.categories.map(c => (
                        <SelectItem key={c.category} value={c.category} className="text-gray-900 hover:bg-gray-100">
                          {c.category} ({c.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All statuses</SelectItem>
                      <SelectItem value="published" className="text-gray-900 hover:bg-gray-100">Published</SelectItem>
                      <SelectItem value="draft" className="text-gray-900 hover:bg-gray-100">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Has Images</Label>
                  <Select
                    value={filters.hasImages === undefined ? 'all' : String(filters.hasImages)}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      hasImages: value === 'all' ? undefined : value === 'true'
                    })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="All articles" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All articles</SelectItem>
                      <SelectItem value="true" className="text-gray-900 hover:bg-gray-100">With images</SelectItem>
                      <SelectItem value="false" className="text-gray-900 hover:bg-gray-100">Without images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Import Status</Label>
                <Select
                  value={filters.importStatus || 'all'}
                  onValueChange={(value) => setFilters({
                    ...filters,
                    importStatus: value === 'all' ? '' : value as 'new' | 'imported' | 'updated'
                  })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="All articles" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All articles</SelectItem>
                    <SelectItem value="new" className="text-gray-900 hover:bg-gray-100">🆕 New (Not Imported)</SelectItem>
                    <SelectItem value="imported" className="text-gray-900 hover:bg-gray-100">✅ Already Imported</SelectItem>
                    <SelectItem value="updated" className="text-gray-900 hover:bg-gray-100">🔄 Updated Since Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                  </div>
                </>
              )}

              <Button
                onClick={loadArticles}
                disabled={loading || !selectedWebsite}
                className="w-full md:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!selectedWebsite ? 'Select a website first' : loading ? 'Loading...' : 'Load Articles'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Preview & Select Articles</CardTitle>
              <CardDescription className="text-gray-600">
                {selectedArticles.size} of {articles.length} articles selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Import Status Summary */}
              {articles.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {articles.filter(a => a.importStatus === 'new').length}
                      </div>
                      <div className="text-sm text-gray-600">🆕 New Articles</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {articles.filter(a => a.importStatus === 'imported').length}
                      </div>
                      <div className="text-sm text-gray-600">✅ Already Imported</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {articles.filter(a => a.importStatus === 'updated').length}
                      </div>
                      <div className="text-sm text-gray-600">🔄 Updated Since Import</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newArticleIds = articles
                        .filter(a => a.importStatus === 'new')
                        .map(a => a.id);
                      setSelectedArticles(new Set(newArticleIds));
                    }}
                  >
                    Select New Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedArticleIds = articles
                        .filter(a => a.importStatus === 'updated')
                        .map(a => a.id);
                      setSelectedArticles(new Set(updatedArticleIds));
                    }}
                  >
                    Select Updated Only
                  </Button>
                </div>
                {selectedArticles.size > 0 && (
                  <Button onClick={() => setActiveTab('import')}>
                    Next: Import {selectedArticles.size} Articles →
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[500px] border rounded-lg p-4">
                <div className="space-y-2">
                  {articles.map(article => (
                    <div
                      key={article.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedArticles.has(article.id)}
                        onCheckedChange={() => toggleArticleSelection(article.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{article.title}</span>
                          {article.importStatus === 'imported' && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              ✅ Imported
                            </Badge>
                          )}
                          {article.importStatus === 'new' && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              🆕 New
                            </Badge>
                          )}
                          {article.importStatus === 'updated' && (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              🔄 Updated
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">
                            <Globe className="h-3 w-3 mr-1" />
                            {article.language}
                          </Badge>
                          {article.category && (
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {article.category}
                            </Badge>
                          )}
                          {article.author && (
                            <Badge variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              {article.author}
                            </Badge>
                          )}
                          {article.has_images && (
                            <Badge variant="outline">
                              <Image className="h-3 w-3 mr-1" />
                              Images
                            </Badge>
                          )}
                          {article.word_count && (
                            <Badge variant="outline">
                              <Hash className="h-3 w-3 mr-1" />
                              {article.word_count} words
                            </Badge>
                          )}
                        </div>
                        {article.created_at && (
                          <div className="text-sm text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(article.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Import Articles</CardTitle>
              <CardDescription className="text-gray-600">Import selected articles to Payload CMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ready to Import</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>You have selected {selectedArticles.size} articles to import.</p>
                    {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'new').length > 0 && (
                      <p>🆕 {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'new').length} new articles will be created</p>
                    )}
                    {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'imported').length > 0 && (
                      <p>✅ {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'imported').length} already imported articles will be updated</p>
                    )}
                    {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'updated').length > 0 && (
                      <p>🔄 {articles.filter(a => selectedArticles.has(a.id) && a.importStatus === 'updated').length} articles have updates since last import and will be refreshed</p>
                    )}
                    <p className="text-sm text-gray-600">This process may take a few minutes depending on the number of articles.</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Import Settings</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="skip-duplicates" defaultChecked />
                    <label htmlFor="skip-duplicates">Skip duplicate articles</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-categories" defaultChecked />
                    <label htmlFor="auto-categories">Auto-map categories</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="preserve-dates" defaultChecked />
                    <label htmlFor="preserve-dates">Preserve original dates</label>
                  </div>
                </div>
              </div>

              {importStatus === 'importing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importStatus === 'completed' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Import Completed</AlertTitle>
                  <AlertDescription>
                    Successfully imported {selectedArticles.size} articles to Payload CMS.
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === 'failed' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>
                    There was an error importing the articles. Please check the logs and try again.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={startImport}
                disabled={importStatus === 'importing'}
                className="w-full"
              >
                {importStatus === 'importing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}