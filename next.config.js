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
  // Handle dynamic routes
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/?tag=:tag',
        has: [{ type: 'query', key: 'tag' }],
      },
    ];
  }
}

module.exports = nextConfig 