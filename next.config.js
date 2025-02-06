/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  ...(process.env.NODE_ENV === 'production' ? {
    basePath: '/360blogz',
    assetPrefix: '/360blogz'
  } : {})
}

module.exports = nextConfig 