// next.config.mjs
import { fileURLToPath } from 'url';
import path from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Add security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' https://*.azure.com https://*.amazonaws.com https://*.stripe.com; frame-ancestors 'none';"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_BASE_URL || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_BASE_URL || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          }
        ]
      }
    ];
  },

  webpack: (config, { isServer }) => {
    // Add SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
      include: path.resolve(__dirname, 'src/assets/images'),
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com'
      },
      {
        protocol: 'https',
        hostname: 'mirasmindstorage.blob.core.windows.net'
      },
      {
        protocol: 'https',
        hostname: 'aetheriqcorestorage-d5ejehf9aqdxhna8.z03.azurefd.net'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },

  async rewrites() {
    return [
      {
        source: "/api/socketio",
        destination: "/api/health-data",
      },
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/:path*",
      },
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      }
    ];
  },

  env: {
    // Azure Configuration
    AZURE_COSMODB_USERNAME: process.env.AZURE_COSMODB_USERNAME,
    AZURE_COSMODB_PASSWORD: process.env.AZURE_COSMODB_PASSWORD,
    AZURE_COSMODB_HOST: process.env.AZURE_COSMODB_HOST,
    AZURE_COSMODB_PORT: process.env.AZURE_COSMODB_PORT,
    AZURE_COSMODB_CONNECTION_STRING: process.env.AZURE_COSMODB_CONNECTION_STRING,
    AZURE_COSMOS_DB_ENDPOINT: process.env.AZURE_COSMOS_DB_ENDPOINT,
    NEXT_PUBLIC_COSMOS_DB_ENDPOINT: process.env.NEXT_PUBLIC_COSMOS_DB_ENDPOINT,
    
    // Azure Storage
    AZURE_BLOB_SAS_TOKEN: process.env.AZURE_BLOB_SAS_TOKEN,
    AZURE_BLOB_CONTAINER_NAME: process.env.AZURE_BLOB_CONTAINER_NAME,
    AZURE_BLOB_ACCOUNT_NAME: process.env.AZURE_BLOB_ACCOUNT_NAME,
    AZURE_BLOB_ACCOUNT_URL: process.env.AZURE_BLOB_ACCOUNT_URL,
    AZURE_BLOB_CONNECTION_STRING: process.env.AZURE_BLOB_CONNECTION_STRING,
    AZURE_BLOB_ACCOUNT_KEY: process.env.AZURE_BLOB_ACCOUNT_KEY,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
    
    // Azure Services
    AZURE_SERVICE_BUS_CONNECTION_STRING: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
    AZURE_SERVICE_BUS_QUEUE_NAME: process.env.AZURE_SERVICE_BUS_QUEUE_NAME,
    AZURE_COMMUNICATIONS_CONNECTION_STRING: process.env.AZURE_COMMUNICATIONS_CONNECTION_STRING,
    AZURE_NOTIFICATION_HUB_CONNECTION_STRING: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
    AZURE_NOTIFICATION_HUB_NAME: process.env.AZURE_NOTIFICATION_HUB_NAME,
    
    // Azure Identity
    AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
    AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
    AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    
    // Redis
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_CONNECTION_STRING: process.env.REDIS_CONNECTION_STRING,
    
    // Stripe
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_FREE_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_FREE_PLAN_ID,
    NEXT_PUBLIC_STRIPE_BASIC_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_BASIC_PLAN_ID,
    NEXT_PUBLIC_STRIPE_PRO_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID,
    NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID,
    
    // API Keys and URLs
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    US_CENSUS_API: process.env.US_CENSUS_API,
    
    // Authentication
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    
    // Misc
    AETHERIQ_EMAIL_SENDER_ADDRESS: process.env.AETHERIQ_EMAIL_SENDER_ADDRESS,
    NEXT_PUBLIC_LOGO_LIGHT: process.env.NEXT_PUBLIC_LOGO_LIGHT,
    NEXT_PUBLIC_LOGO_DARK: process.env.NEXT_PUBLIC_LOGO_DARK,
    USE_MOCK_DATA: process.env.USE_MOCK_DATA,
    
    // Web Push
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  },

  transpilePackages: [
    'three',
    '@mui/x-date-pickers',
    'react-speech-recognition',
  ],
};

export default nextConfig;
