// src/constants/azureConstants.ts

import { Delete } from "@mui/icons-material";

// Azure configs
export const AZURE_COSMOSDB_CONFIG = {
  USERNAME: process.env.NEXT_PUBLIC_AZURE_COSMOSDB_USERNAME || '',
  PASSWORD: process.env.NEXT_PUBLIC_AZURE_COSMOSDB_PASSWORD || '',
  HOST: process.env.NEXT_PUBLIC_AZURE_COSMOSDB_HOST || '',
  DEFAULT_DB_NAME: process.env.NEXT_PUBLIC_COSMOS_DATABASE_NAME || '',
};

export const AZURE_SUBSCRIPTION_ID = process.env.NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID || '';
export const AZURE_RESOURCE_GROUP = process.env.NEXT_PUBLIC_AZURE_RESOURCE_GROUP_NAME || '';

export const AZURE_BLOB_STORAGE_CONFIG = {
  ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
  ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads', // Provide a default
  FRONT_DOOR_ENDPOINT: process.env.AZURE_FRONT_DOOR_ENDPOINT || ''
} as const;

// export const AZURE_BLOB_STORAGE_CONFIG = {
//   ACCOUNT_NAME: process.env.AZURE_BLOB_ACCOUNT_NAME || '',
//   ACCOUNT_KEY: process.env.AZURE_BLOB_ACCOUNT_KEY || '',
//   CONTAINER_NAME: process.env.AZURE_BLOB_CONTAINER_NAME || '',
// };

export const AZURE_BLOB_SAS_CONFIG = {
  PERMISSIONS: process.env.AZURE_BLOB_SAS_PERMISSIONS || 'r',
  EXPIRATION_MINUTES: Number(process.env.AZURE_BLOB_SAS_EXPIRATION_MINUTES) || 15,
};

export const AZURE_RESOURCE_CONFIG = {
  SUBSCRIPTION_ID: process.env.NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID || '',
  RESOURCE_GROUP_NAME: process.env.NEXT_PUBLIC_AZURE_RESOURCE_GROUP_NAME || '',
  TENANT_ID: process.env.NEXT_PUBLIC_AZURE_TENANT_ID || '',
  CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
  STORAGE_ACCOUNT_NAME: process.env.NEXT_PUBLIC_STORAGE_ACCOUNT_NAME || '',
  COSMOS_ACCOUNT_NAME: process.env.NEXT_PUBLIC_COSMOS_ACCOUNT_NAME || '',
};

export const validateConfig = () => {
  const requiredVars = {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_NAME,
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || AZURE_BLOB_STORAGE_CONFIG.ACCOUNT_KEY,
    containerName: AZURE_BLOB_STORAGE_CONFIG.CONTAINER_NAME,
    frontDoorEndpoint: process.env.AZURE_FRONT_DOOR_ENDPOINT
  };

   // Validate required values
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing required Azure configuration: ${key}`);
    }
  });

  // Additional validation for container name
  if (!/^[a-z0-9](?!.*--)[a-z0-9-]{1,61}[a-z0-9]$/.test(requiredVars.containerName)) {
    throw new Error('Invalid container name format. Container names must be 3-63 characters, start with a letter or number, and can only contain lowercase letters, numbers, and dashes.');
  }

  return requiredVars;
};


export const AZURE_API_VERSIONS = {
  STORAGE: process.env.NEXT_PUBLIC_AZURE_API_VERSION_STORAGE || '2021-04-01',
  COSMOS_DB: process.env.NEXT_PUBLIC_AZURE_API_VERSION_COSMOS_DB || '2021-10-15',
};

export const AZURE_RESOURCE_PROVIDERS = {
  STORAGE: process.env.NEXT_PUBLIC_AZURE_RESOURCE_PROVIDER_STORAGE || 'Microsoft.Storage',
  COSMOS_DB: process.env.NEXT_PUBLIC_AZURE_RESOURCE_PROVIDER_COSMOS_DB || 'Microsoft.DocumentDB',
};

export const AZURE_SERVICE_BUS_CONFIG = {
  CONNECTION_STRING: process.env.NEXT_PUBLIC_AZURE_SERVICE_BUS_CONNECTION_STRING || '',
  QUEUE_NAME: process.env.NEXT_PUBLIC_AZURE_SERVICE_BUS_QUEUE_NAME || '',
};

export const AZURE_FUNCTION_APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_AZURE_FUNCTION_APP_NAME || '',
  RESOURCE_GROUP: process.env.NEXT_PUBLIC_AZURE_RESOURCE_GROUP_NAME || '',
};

export const AZURE_INSIGHTS_CONFIG = {
  APP_INSIGHTS_KEY: process.env.NEXT_PUBLIC_AZURE_APP_INSIGHTS_KEY || '',
};

export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  SETTINGS: 'settings',
} as const;

export const API_ENDPOINTS = {
  BLOB: {
    CREATE_CONTAINER: '/api/azure/blob/createContainer',
    LIST_CONTAINERS: '/api/azure/blob/listContainers',
    UPLOAD_BLOB: '/api/azure/blob/uploadBlob',
    LIST_BLOBS: '/api/azure/blob/listBlobs',
    DELETE_BLOB: '/api/azure/blob/deleteBlob',
    DELETE_CONTAINER: '/api/azure/blob/deleteContainer', // Add this
  },
  COSMOS: {
    CREATE_DATABASE: '/api/azure/cosmos/createDatabase',
    CREATE_COLLECTION: '/api/azure/cosmos/createCollection',
    LIST_DATABASES: '/api/azure/cosmos/listDatabases',
  },
  FUNCTIONS: {
    CREATE_FUNCTION: '/api/azure/functions/createFunction',
    LIST_FUNCTIONS: '/api/azure/functions/listFunctions',
    DELETE_FUNCTION: '/api/azure/functions/deleteFunction',
  },
  INSIGHTS: {
    CREATE_WIDGET: '/api/azure/insights/createInsightsWidget',
  },
  STORAGE: {
    CREATE_STORAGE_ACCOUNT: '/api/azure/storage/createStorageAccount',
    LIST_STORAGE_ACCOUNTS: '/api/azure/storage/listStorageAccounts',
  },
  RESOURCES: {
    GET_DETAILS: '/api/azure/resources/getResourceDetails', // Update this
  },
};

export const AZURE_RESOURCE_TYPES = {
  STORAGE_ACCOUNT: process.env.NEXT_PUBLIC_AZURE_RESOURCE_TYPE_STORAGE_ACCOUNT || 'Microsoft.Storage/storageAccounts',
  COSMOS_DB_ACCOUNT: process.env.NEXT_PUBLIC_AZURE_RESOURCE_TYPE_COSMOS_DB_ACCOUNT || 'Microsoft.DocumentDB/databaseAccounts',
  FUNCTION_APP: process.env.NEXT_PUBLIC_AZURE_RESOURCE_TYPE_FUNCTION_APP || 'Microsoft.Web/sites',
};