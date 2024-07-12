/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_COSMOS_DB_ENDPOINT: process.env.NEXT_PUBLIC_COSMOS_DB_ENDPOINT,
    AZURE_COSMODB_USERNAME: process.env.AZURE_COSMODB_USERNAME,
    AZURE_COSMODB_PASSWORD: process.env.AZURE_COSMODB_PASSWORD,
    AZURE_COSMODB_HOST: process.env.AZURE_COSMODB_HOST,
    AZURE_COSMODB_PORT: process.env.AZURE_COSMODB_PORT,
    COSMOS_DB_KEY: process.env.COSMOS_DB_KEY,
    COSMOS_DB_NAME: process.env.COSMOS_DB_NAME,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    AZURE_NOTIFICATION_HUB_NAME: process.env.AZURE_NOTIFICATION_HUB_NAME,
    AZURE_NOTIFICATION_HUB_CONNECTION_STRING: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    AZURE_BLOB_SAS_TOKEN: process.env.AZURE_BLOB_SAS_TOKEN,
    AZURE_BLOB_CONTAINER_NAME: process.env.AZURE_BLOB_CONTAINER_NAME,
    AZURE_BLOB_ACCOUNT_NAME: process.env.AZURE_BLOB_ACCOUNT_NAME,
    AZURE_BLOB_ACCOUNT_URL: process.env.AZURE_BLOB_ACCOUNT_URL,
    AETHERIQ_EMAIL_SENDER_ADDRESS: process.env.AETHERIQ_EMAIL_SENDER_ADDRESS,
    AZURE_COMMUNICATIONS_CONNECTION_STRING: process.env.AZURE_COMMUNICATIONS_CONNECTION_STRING,
    AZURE_COMMUNICATIONS_PHONE_NUMBER: process.env.AZURE_COMMUNICATIONS_PHONE_NUMBER,
    AZURE_COMMUNICATIONS_PHONE_NUMBER_COUNTRY_CODE: process.env.AZURE_COMMUNICATIONS_PHONE_NUMBER_COUNTRY_CODE,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,

  },
  transpilePackages: ['three'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/socketio",
        destination: "/api/health-data",
      },
    ];
  },
};

export default nextConfig;
