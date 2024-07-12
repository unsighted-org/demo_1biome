import { generateSasToken, azureStorageConfig } from '@/config/azureBlobStorage';
import { azureConfig } from '@/config/azureConfig';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ token: string } | { error: string }>
): void {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('Request body:', req.body); // Debugging

  const { hubName } = req.body;

  console.log('Azure Config:', azureConfig); // Debugging
  console.log('Azure Storage Config:', azureStorageConfig); // Debugging

  if (hubName !== azureConfig.notificationHubName) {
    return res.status(400).json({ error: 'Invalid hub name' });
  }

  if (!azureStorageConfig.accountName || !azureStorageConfig.accountKey || !azureStorageConfig.containerName) {
    return res.status(500).json({ error: 'Missing Azure Storage configuration' });
  }

  try {
    const token = generateSasToken(
      azureStorageConfig.accountName,
      azureStorageConfig.accountKey,
      azureStorageConfig.containerName
    );
    res.status(200).json({ token: token });
  } catch (error) {
    console.error('Error generating SAS token:', error);
    res.status(500).json({ error: 'Failed to generate SAS token' });
  }
}