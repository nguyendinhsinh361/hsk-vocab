/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build standalone cho Docker (Dockerfile). Dev không ảnh hưởng.
  output: 'standalone',
  async rewrites() {
    const api = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
      // File tĩnh (audio/image) phục vụ từ backend/assets
      { source: '/static/:path*', destination: `${api}/static/:path*` },
    ];
  },
};

module.exports = nextConfig;
