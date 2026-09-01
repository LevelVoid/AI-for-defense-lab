/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@monaco-editor/react'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
