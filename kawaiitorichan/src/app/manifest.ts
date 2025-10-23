import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kawaii Small Bird - 小鳥の総合情報サイト',
    short_name: 'Kawaii Bird',
    description: '小鳥の飼育、健康管理、種類に関する総合情報サイト - Kawaii Small Bird',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#357A35',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'ja-JP',
    dir: 'ltr',
    categories: ['pets', 'education', 'lifestyle'],
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
