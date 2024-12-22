import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol } from '@azure/storage-blob';
import { azureConfig } from '@/config/azureConfig';

export const azureStorageConfig = {
  accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
  accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || '',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { hubName } = req.body;
  if (hubName !== azureConfig.notificationHubName) {
    return res.status(400).json({ error: 'Invalid hub name' });
  }

  const { accountName, accountKey, containerName } = azureStorageConfig;
  if (!accountName || !accountKey || !containerName) {
    return res.status(500).json({ error: 'Missing Azure Storage configuration' });
  }

  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential
    ).toString();

    return res.status(200).json({ token: sasToken });
  } catch (error) {
    console.error('Error generating SAS token:', error);
    return res.status(500).json({ error: 'Failed to generate SAS token' });
  }
}
