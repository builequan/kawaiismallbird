'use client'

import React, { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export const AdSidebar: React.FC = () => {
  useEffect(() => {
    // Push ad when component mounts
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <aside className="hidden lg:block col-start-3 row-start-1">
      <div className="sticky top-24 ml-4 xl:ml-8">
        {/* Google AdSense Container */}
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-[300px]">
          {/* AdSense Script - loaded once */}
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3202734384173696"
            crossOrigin="anonymous"
          />

          {/* Ad Unit */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-3202734384173696"
            data-ad-slot="7980873855"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </aside>
  )
}

export default AdSidebar
