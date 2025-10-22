import React from 'react'

// Minimal layout for offline page - no database access
export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
