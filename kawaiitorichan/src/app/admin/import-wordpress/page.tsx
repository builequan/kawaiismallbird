'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, Upload, Trash2, Plus } from 'lucide-react'
import { FolderPicker } from '@/components/FolderPicker'

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    file: string
    error: string
  }>
  details: Array<{
    file: string
    title: string
    slug: string
    status: 'created' | 'updated' | 'skipped' | 'failed'
  }>
}

export default function ImportWordPressPage() {
  const [folderPath, setFolderPath] = useState('')
  const [imagesFolder, setImagesFolder] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [overwrite, setOverwrite] = useState(false)
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  // Batch import states
  const [batchFolders, setBatchFolders] = useState<Array<{ folderPath: string; imagesFolder: string }>>([
    { folderPath: '', imagesFolder: '' },
  ])
  
  const handleImport = async (batch = false) => {
    setIsImporting(true)
    setError(null)
    setResult(null)
    setProgress(0)
    
    try {
      const response = await fetch('/api/import-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          batch
            ? { 
                folders: batchFolders.filter(f => f.folderPath && f.imagesFolder), 
                dryRun, 
                overwrite,
                removeDuplicates 
              }
            : { folderPath, imagesFolder, dryRun, overwrite, removeDuplicates }
        ),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        // Batch import results
        const combined: ImportResult = {
          success: data.every(r => r.success),
          imported: data.reduce((sum, r) => sum + r.imported, 0),
          failed: data.reduce((sum, r) => sum + r.failed, 0),
          errors: data.flatMap(r => r.errors),
          details: data.flatMap(r => r.details),
        }
        setResult(combined)
      } else {
        setResult(data)
      }
      
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }
  
  const addBatchFolder = () => {
    setBatchFolders([...batchFolders, { folderPath: '', imagesFolder: '' }])
  }
  
  const updateBatchFolder = (index: number, field: 'folderPath' | 'imagesFolder', value: string) => {
    const updated = [...batchFolders]
    updated[index][field] = value
    setBatchFolders(updated)
  }
  
  const removeBatchFolder = (index: number) => {
    if (batchFolders.length > 1) {
      setBatchFolders(batchFolders.filter((_, i) => i !== index))
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WordPress Content Import</h1>
        <p className="text-gray-600">Import markdown files from WordPress export into Payload CMS</p>
      </div>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Folder</TabsTrigger>
          <TabsTrigger value="batch">Batch Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Import from Single Folder</CardTitle>
              <CardDescription>
                Select folders containing your markdown files and images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FolderPicker
                label="Markdown Files Folder"
                selectedPath={folderPath}
                onSelect={setFolderPath}
                filterType="markdown"
              />
              
              <FolderPicker
                label="Images Folder"
                selectedPath={imagesFolder}
                onSelect={setImagesFolder}
                filterType="images"
              />
              
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dryRun"
                    checked={dryRun}
                    onCheckedChange={(checked) => setDryRun(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="dryRun" className="cursor-pointer">
                    Dry Run (preview changes without saving)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwrite}
                    onCheckedChange={(checked) => setOverwrite(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="overwrite" className="cursor-pointer">
                    Overwrite Existing Posts
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="removeDuplicates"
                    checked={removeDuplicates}
                    onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="removeDuplicates" className="cursor-pointer">
                    Remove Duplicate Titles and Hero Images (Recommended)
                  </Label>
                </div>
              </div>
              
              <Button
                onClick={() => handleImport(false)}
                disabled={isImporting || !folderPath || !imagesFolder}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {dryRun ? 'Preview Import' : 'Start Import'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Import Multiple Folders</CardTitle>
              <CardDescription>
                Import markdown files from multiple folders at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchFolders.map((folder, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-base font-semibold">Folder Set {index + 1}</Label>
                      {batchFolders.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBatchFolder(index)}
                          disabled={isImporting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <FolderPicker
                      label="Markdown Files Folder"
                      selectedPath={folder.folderPath}
                      onSelect={(path) => updateBatchFolder(index, 'folderPath', path)}
                      filterType="markdown"
                    />
                    
                    <FolderPicker
                      label="Images Folder"
                      selectedPath={folder.imagesFolder}
                      onSelect={(path) => updateBatchFolder(index, 'imagesFolder', path)}
                      filterType="images"
                    />
                  </div>
                </Card>
              ))}
              
              <Button
                variant="outline"
                onClick={addBatchFolder}
                disabled={isImporting}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Folder Set
              </Button>
              
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batchDryRun"
                    checked={dryRun}
                    onCheckedChange={(checked) => setDryRun(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="batchDryRun" className="cursor-pointer">
                    Dry Run (preview changes without saving)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batchOverwrite"
                    checked={overwrite}
                    onCheckedChange={(checked) => setOverwrite(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="batchOverwrite" className="cursor-pointer">
                    Overwrite Existing Posts
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batchRemoveDuplicates"
                    checked={removeDuplicates}
                    onCheckedChange={(checked) => setRemoveDuplicates(checked as boolean)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="batchRemoveDuplicates" className="cursor-pointer">
                    Remove Duplicate Titles and Hero Images (Recommended)
                  </Label>
                </div>
              </div>
              
              <Button
                onClick={() => handleImport(true)}
                disabled={isImporting || !batchFolders.some(f => f.folderPath && f.imagesFolder)}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {dryRun ? 'Preview Batch Import' : 'Start Batch Import'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {isImporting && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">Processing files...</p>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              {result.success ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                  Import {dryRun ? 'Preview' : 'Complete'}
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                <p className="text-sm text-green-600">Successfully Imported</p>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>
            
            {result.details.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold mb-2">Import Details:</h3>
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {result.details.map((detail, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        detail.status === 'created' ? 'bg-green-50' :
                        detail.status === 'updated' ? 'bg-blue-50' :
                        detail.status === 'skipped' ? 'bg-yellow-50' :
                        'bg-red-50'
                      }`}
                    >
                      <span className="font-medium">{detail.file}</span>
                      <span className="ml-2 text-gray-600">→</span>
                      <span className="ml-2">{detail.status}</span>
                      {detail.title && (
                        <span className="ml-2 text-gray-600">({detail.title})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {result.errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Errors:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>
                        <strong>{error.file}:</strong> {error.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}