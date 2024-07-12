import dotenv from 'dotenv';

import type { MongoClient } from 'mongodb';

dotenv.config();

let cachedClient: MongoClient | null = null;

async function getCosmosClient(): Promise<MongoClient | null> {
  if (cachedClient) return cachedClient;

  const username = process.env.AZURE_COSMODB_USERNAME;
  const password = process.env.AZURE_COSMODB_PASSWORD;
  const host = process.env.AZURE_COSMODB_HOST;

  if (!username || !password || !host) {
    throw new Error("Missing required environment variables for Azure Cosmos DB connection");
  }

  const connectionString = `mongodb://${username}:${password}@${host}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@${host}@`;

  if (typeof window === 'undefined') {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(connectionString);
    await client.connect();
    cachedClient = client;
    return client;
  }

  return null;
}

export { getCosmosClient };

export const azureConfig = {
  notificationHubName: process.env.AZURE_NOTIFICATION_HUB_NAME,
  connectionString: process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING,
};

export const redisConfig: {
  host: string | undefined;
  port: number;
  password: string | undefined;
  tls: boolean;
} = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
  password: process.env.REDIS_PASSWORD,
  tls: true,
};
