import type { NextConfig } from 'next';

// GLOBAL WEBSITE SECURITY HEADERS

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },

  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },

  {
    key: 'Content-Security-Policy',
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; '),
  },

  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];

// NEXT.JS CONFIGURATION

const nextConfig: NextConfig = {

  // REMOVE NEXT.JS IDENTIFICATION HEADER

  poweredByHeader: false,

  // ENABLE REACT STRICT MODE

  reactStrictMode: true,

  // DISABLE PUBLIC PRODUCTION SOURCE MAPS

  productionBrowserSourceMaps: false,

  // APPLY GLOBAL SECURITY HEADERS

  async headers() {
    return [
      {
        source: '/:path*',

        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;