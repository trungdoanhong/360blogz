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
  // Disable dynamic routes for static export
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/login': { page: '/login' },
      '/signup': { page: '/signup' },
      '/profile': { page: '/profile' },
      '/new-blog': { page: '/new-blog' },
    }
  }
}

module.exports = nextConfig 