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
  // Generate static pages for common tags
  exportPathMap: async function() {
    const paths = {
      '/': { page: '/' },
      '/login': { page: '/login' },
      '/signup': { page: '/signup' },
      '/profile': { page: '/profile' },
      '/new-blog': { page: '/new-blog' },
    };

    // Add common tag paths
    const commonTags = ['technology', 'lifestyle', 'personal', 'coding', 'web'];
    for (const tag of commonTags) {
      paths[`/?tag=${tag}`] = { 
        page: '/',
        query: { tag }
      };
    }

    return paths;
  }
}

module.exports = nextConfig 