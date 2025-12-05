import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow cross-origin requests from local network during development
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS 
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(ip => ip.trim())
    : ['localhost'],
  
  devIndicators: false,  

  // Performance optimizations for faster startup
  experimental: {
    // Optimize package imports for faster compilation
    optimizePackageImports: ['lucide-react', 'framer-motion', 'react-icons'],
  },
  
  // Turbopack configuration for 10x faster dev builds
  turbopack: {},
  
  // Faster refresh in development
  reactStrictMode: true,
  
  // Skip type checking during dev (use IDE for that)
  typescript: {
    ignoreBuildErrors: true, // Much faster startup, use 'bun run check' to validate
  },
};

export default nextConfig;