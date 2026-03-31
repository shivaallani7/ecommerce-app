/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Optimized for Azure App Service Docker deployment

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: '*.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_AAD_B2C_TENANT: process.env.NEXT_PUBLIC_AAD_B2C_TENANT || '',
    NEXT_PUBLIC_AAD_B2C_CLIENT_ID: process.env.NEXT_PUBLIC_AAD_B2C_CLIENT_ID || '',
    NEXT_PUBLIC_APP_INSIGHTS_KEY: process.env.NEXT_PUBLIC_APP_INSIGHTS_KEY || '',
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
