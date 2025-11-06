import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: [
    '192.168.3.39',
    '192.168.3.*',
    'localhost',
  ],
  
  // Performance optimizations for faster startup
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Faster refresh in development
  reactStrictMode: true,
  
  // Skip type checking during dev (use IDE for that)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Optimize webpack for faster builds
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Faster builds in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
