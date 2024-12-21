import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";

import type { ContainerClient } from "@azure/storage-blob";

dotenv.config();

class AzureBlobStorage {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor(connectionString: string, containerName: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const sanitizedContainerName = this.sanitizeContainerName(containerName);
    this.containerClient = this.blobServiceClient.getContainerClient(sanitizedContainerName);
  }

  private sanitizeContainerName(containerName: string): string {
    const sanitized = containerName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (sanitized.length < 3 || sanitized.length > 63) {
      throw new Error("Container name must be between 3 and 63 characters after sanitization");
    }
    return sanitized;
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
