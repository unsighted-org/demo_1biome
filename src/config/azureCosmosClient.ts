import { MongoClient, Collection, Db } from 'mongodb';
import { AZURE_COSMOSDB_CONFIG } from '@/constants/azureConstants';

let cachedClient: MongoClient | null = null;
let inMemoryDb: { [key: string]: any[] } = {};

// Helper function to check if we should use in-memory storage
const useInMemoryStorage = () => {
  return process.env.NODE_ENV === 'development' && !AZURE_COSMOSDB_CONFIG.USERNAME;
};

export async function getCosmosClient(): Promise<MongoClient | null> {
  // Use in-memory storage for local development if Azure credentials are not set
  if (useInMemoryStorage()) {
    return null;
  }

  if (cachedClient) return cachedClient;

  const { USERNAME, PASSWORD, HOST, DEFAULT_DB_NAME } = AZURE_COSMOSDB_CONFIG;

  if (!USERNAME || !PASSWORD || !HOST || !DEFAULT_DB_NAME) {
    console.warn("Azure Cosmos DB configuration not found, using in-memory storage for development");
    return null;
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
      console.warn('Falling back to in-memory storage');
      return null;
    }
  }

  return null;
}

// Mock Collection class for in-memory storage
class InMemoryCollection {
  private data: any[];
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.data = inMemoryDb[collectionName] || [];
    inMemoryDb[collectionName] = this.data;
  }

  async insertOne(doc: any) {
    const _id = Math.random().toString(36).substr(2, 9);
    const newDoc = { ...doc, _id };
    this.data.push(newDoc);
    return { insertedId: _id, acknowledged: true };
  }

  async findOne(query: any) {
    return this.data.find(item => 
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
  }

  async find(query: any = {}) {
    const results = this.data.filter(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    return {
      toArray: async () => results
    };
  }

  async updateOne(query: any, update: any) {
    const index = this.data.findIndex(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...update.$set };
      return { modifiedCount: 1, acknowledged: true };
    }
    return { modifiedCount: 0, acknowledged: true };
  }

  async deleteOne(query: any) {
    const index = this.data.findIndex(item =>
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    if (index !== -1) {
      this.data.splice(index, 1);
      return { deletedCount: 1, acknowledged: true };
    }
    return { deletedCount: 0, acknowledged: true };
  }
}

export async function getCollection(collectionName: string): Promise<Collection | InMemoryCollection> {
  const client = await getCosmosClient();
  
  if (!client || useInMemoryStorage()) {
    console.log(`Using in-memory storage for collection: ${collectionName}`);
    return new InMemoryCollection(collectionName);
  }
  
  return client.db(AZURE_COSMOSDB_CONFIG.DEFAULT_DB_NAME).collection(collectionName);
}

// Cleanup function to close the connection
export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
  }
  // Clear in-memory database
  inMemoryDb = {};
}

// src/config/azureCosmosClient.ts
export async function getPaymentsDb(): Promise<{ db: any }> {
  const client = await getCosmosClient();
  if (!client) {
    throw new Error('Failed to get Cosmos DB client');
  }
  return { db: client.db(AZURE_COSMOSDB_CONFIG.DEFAULT_DB_NAME) };
}

// Graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.once('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
  });

  process.once('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
  });
}