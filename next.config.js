/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    unoptimized: process.env.NODE_ENV === 'production', // Only unoptimized for static export
  },
  // Remove ignoreBuildErrors and ignoreDuringBuilds for better code quality
  experimental: {
    optimizePackageImports: ['@heroicons/react', '@headlessui/react']
  },
  // Only use static export and basePath for production deployment
  ...(process.env.DEPLOY_TARGET === 'static' ? {
    output: 'export',
    trailingSlash: true,
    basePath: '/360blogz',
    assetPrefix: '/360blogz'
  } : {})
}

module.exports = nextConfig 