import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Completely disable static optimization for Docker builds
  generateBuildId: () => 'build',
  generateEtags: false,
  compress: false,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    // Disable all static generation
    isrMemoryCacheSize: 0,
    workerThreads: false,
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip all page pre-rendering
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default withPayload(nextConfig)