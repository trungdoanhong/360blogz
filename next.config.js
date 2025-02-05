/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/360blogz',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  // Generate a 404 page that will be used for all dynamic routes
  experimental: {
    appDir: true,
    fallback: true
  }
}

module.exports = nextConfig 