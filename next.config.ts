import type { NextConfig } from 'next'
import { ADMIN_PANEL_PATH } from './lib/admin-path'

const isDevelopment = process.env.NODE_ENV === 'development'

const adminPanelSegment = ADMIN_PANEL_PATH.replace(/^\//, '') || 'admin-panel'

const websiteBaseRaw = (process.env.NEXT_PUBLIC_WEBSITE_BASE ?? '').trim()
const websiteBasePath =
  websiteBaseRaw === ''
    ? ''
    : (websiteBaseRaw.startsWith('/')
        ? websiteBaseRaw
        : `/${websiteBaseRaw}`
      ).replace(/\/+$/, '') || ''

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 't2.gstatic.com', pathname: '/**' },
      { protocol: 'https', hostname: 't3.gstatic.com', pathname: '/**' },
    ],
  },
  // Explicitly enable Turbopack (we keep webpack config for prod SSR only).
  turbopack: {},
  experimental: {
    // Development optimizations
    ...(isDevelopment && {
      optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    }),
  },
  // Only use standalone output in production
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  async redirects() {
    const root = websiteBasePath === '' ? '/' : websiteBasePath
    return [
      { source: '/website', destination: root, permanent: true },
      {
        source: '/website/:path*',
        destination:
          websiteBasePath === '' ? '/:path*' : `${websiteBasePath}/:path*`,
        permanent: true,
      },
    ]
  },
  async rewrites() {
    // App routes live under /admin-panel; map ADMIN_PANEL_URL (e.g. /abudabi) to that tree.
    if (adminPanelSegment === 'admin-panel') {
      return []
    }
    return [
      { source: `/${adminPanelSegment}`, destination: '/admin-panel' },
      {
        source: `/${adminPanelSegment}/:path*`,
        destination: '/admin-panel/:path*',
      },
    ]
  },
  // Externalize heavy logging deps so Turbopack doesn't attempt to bundle their test assets
  serverExternalPackages: [
    'node-cron',
    'pino',
    'thread-stream',
    'sonic-boom',
    'pino-pretty',
    'archiver',
  ],
  transpilePackages: ['rimraf'],
  // Webpack config only for production builds (Turbopack is used in dev)
  // Turbopack handles XLSX automatically, so webpack config is only needed for production
  ...(process.env.NODE_ENV === 'production' && {
    webpack: (config, { isServer }) => {
      if (isServer) {
        // Ensure XLSX works correctly on server-side
        config.externals = config.externals || []
        config.resolve.alias = {
          ...config.resolve.alias,
        }
      }
      return config
    },
  }),
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
          },
        ],
      },
    ]
  },
}

export default nextConfig
