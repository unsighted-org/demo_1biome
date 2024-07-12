import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import dotenv from "dotenv";
import type { ContainerClient } from "@azure/storage-blob";

dotenv.config();

export const azureStorageConfig = {
  accountName: process.env.AZURE_BLOB_ACCOUNT_NAME || '',
  accountKey: process.env.AZURE_BLOB_ACCOUNT_KEY || '',
  containerName: process.env.AZURE_BLOB_CONTAINER_NAME || '',
};

export function generateSasToken(accountName: string, accountKey: string, containerName: string): string {
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

  const sasToken = generateBlobSASQueryParameters({
    containerName: containerName,
    permissions: BlobSASPermissions.parse("r"),
    expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // Token expires in 1 hour
  }, sharedKeyCredential).toString();

  return sasToken;
}

class AzureBlobStorage {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    const sharedKeyCredential = new StorageSharedKeyCredential(azureStorageConfig.accountName, azureStorageConfig.accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${azureStorageConfig.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    this.containerClient = this.blobServiceClient.getContainerClient(azureStorageConfig.containerName);
  }

  async createContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      await this.containerClient.create();
      console.log(`Container ${this.containerClient.containerName} created.`);
    } else {
      console.log(`Container ${this.containerClient.containerName} already exists.`);
    }
  }

  async uploadBlob(blobName: string, data: Buffer): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(data);
    console.log(`Blob ${blobName} uploaded successfully.`);
  }

  async downloadBlob(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    const downloaded = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody || null);
    console.log(`Blob ${blobName} downloaded successfully.`);
    return downloaded;
  }

  async deleteBlob(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`Blob ${blobName} deleted successfully.`);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream | null): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream?.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream?.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream?.on("error", reject);
    });
  }
}

export default AzureBlobStorage;
