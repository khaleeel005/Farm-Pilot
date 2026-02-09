import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy API requests to Express backend during development
  async rewrites() {
    // Only rewrite for development - production uses same origin
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5001/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
