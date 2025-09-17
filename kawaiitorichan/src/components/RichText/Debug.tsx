'use client'

import React from 'react'

export default function DebugRichText({ data }: { data: any }) {
  console.log('RichText Debug - Data received:', data)
  
  if (!data) {
    return <div className="p-4 bg-red-100 text-red-700">No data provided to RichText</div>
  }
  
  if (!data.root) {
    return <div className="p-4 bg-yellow-100 text-yellow-700">Data has no root property</div>
  }
  
  if (!data.root.children) {
    return <div className="p-4 bg-yellow-100 text-yellow-700">Root has no children</div>
  }
  
  if (!Array.isArray(data.root.children)) {
    return <div className="p-4 bg-yellow-100 text-yellow-700">Children is not an array</div>
  }
  
  if (data.root.children.length === 0) {
    return <div className="p-4 bg-yellow-100 text-yellow-700">Children array is empty</div>
  }
  
  return (
    <div className="p-4 bg-green-100 text-green-700">
      <p>Content structure looks valid:</p>
      <ul>
        <li>Children count: {data.root.children.length}</li>
        <li>First child type: {data.root.children[0]?.type}</li>
        <li>Has text: {data.root.children[0]?.children?.[0]?.text ? 'Yes' : 'No'}</li>
      </ul>
      <details className="mt-4">
        <summary>Raw data (click to expand)</summary>
        <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  )
}