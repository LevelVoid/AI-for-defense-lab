/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@monaco-editor/react'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
