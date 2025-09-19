'use client'

import ContentImportManager from '@/components/admin/ContentImportManager'

export default function DatabaseImportPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Database Import</h1>
        <ContentImportManager />
      </div>
    </div>
  )
}