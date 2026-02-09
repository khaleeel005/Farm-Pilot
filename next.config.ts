import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy API requests to Express backend during development only
  async rewrites() {
    // Development mode: Next.js runs on port 3000, Express API on port 5001
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: 'http://localhost:5001/api/:path*',
          },
        ],
      };
    }
    // Production: Don't rewrite - Express handles /api routes directly
    return {
      beforeFiles: [],
    };
  },
};

export default nextConfig;
