import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Golf Knowledge Hub - ゴルフ総合情報サイト',
    short_name: 'Golf Hub',
    description: 'ゴルフの知識、技術、機器に関する総合情報サイト - Golf Knowledge Hub',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#357A35',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ja-JP',
    dir: 'ltr',
    categories: ['sports', 'education', 'lifestyle'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/favicon-navi.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
