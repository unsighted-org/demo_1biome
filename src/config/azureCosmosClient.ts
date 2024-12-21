import { MongoClient } from 'mongodb';
import { AZURE_COSMOSDB_CONFIG } from '@/constants/azureConstants';

let cachedClient: MongoClient | null = null;

export async function getCosmosClient(): Promise<MongoClient | null> {
  if (cachedClient) return cachedClient;

  const { USERNAME, PASSWORD, HOST, DEFAULT_DB_NAME } = AZURE_COSMOSDB_CONFIG;

  if (!USERNAME || !PASSWORD || !HOST || !DEFAULT_DB_NAME) {
    throw new Error("Missing required Azure Cosmos DB configuration");
  }

  const connectionString = `mongodb://${USERNAME}:${PASSWORD}@${HOST}.mongo.cosmos.azure.com:10255/${DEFAULT_DB_NAME}?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@${HOST}@`;

  if (typeof window === 'undefined') {
    try {
      const client = new MongoClient(connectionString);
      await client.connect();
      cachedClient = client;
      return client;
    } catch (error) {
      console.error('Failed to connect to Azure Cosmos DB:', error);
      throw error;
    }
  }

  return null;
}

export async function getCollection(collectionName: string) {
  const client = await getCosmosClient();
  if (!client) {
    throw new Error('Failed to get Cosmos DB client');
  }
  
  return client.db(AZURE_COSMOSDB_CONFIG.DEFAULT_DB_NAME).collection(collectionName);
}

// Cleanup function to close the connection
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
  }
}

// src/config/azureCosmosClient.ts
export async function getPaymentsDb(): Promise<{ db: any }> {
  const client = await getCosmosClient();
  if (!client) {
    throw new Error('Failed to get Cosmos DB client');
  }
  return { db: client.db(AZURE_COSMOSDB_CONFIG.DEFAULT_DB_NAME) };
}

// Graceful shutdown handlers - these are safe to add as they don't affect normal operation
if (typeof process !== 'undefined') {
  process.once('SIGINT', async () => {
    await closeConnection();
  });

  process.once('SIGTERM', async () => {
    await closeConnection();
  });
}