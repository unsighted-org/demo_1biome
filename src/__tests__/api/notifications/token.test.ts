import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/notifications/token';
import { AZURE_COSMOSDB_CONFIG } from '@/constants/azureConstants';

jest.mock('@azure/storage-blob', () => ({
  StorageSharedKeyCredential: jest.fn(),
  generateBlobSASQueryParameters: jest.fn(() => ({
    toString: () => 'mocked-sas-token',
  })),
  BlobSASPermissions: {
    parse: jest.fn(),
  },
  SASProtocol: {
    Https: 'https',
  },
}));

jest.mock('@/constants/azureConstants', () => ({
  AZURE_COSMOSDB_CONFIG: {
    notificationHubName: 'notification-hub',
    connectionString: 'test-connection-string',
  },
}));

describe('Token API', () => {
  let req: NextApiRequest;
  let res: NextApiResponse;

  beforeEach(() => {
    const { req: request, res: response } = createMocks({
      method: 'POST',
      body: {
        hubName: 'notification-hub',
      },
    });

    // Cast the mocked request and response to their proper types
    req = request as unknown as NextApiRequest;
    res = response as unknown as NextApiResponse;
  });

  it('should return a valid SAS token', async () => {
    await handler(req, res);
    expect((res as any)._getStatusCode()).toBe(200);
    expect(JSON.parse((res as any)._getData())).toEqual({ token: 'mocked-sas-token' });
  });

  it('should return an error if the method is not POST', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect((res as any)._getStatusCode()).toBe(405);
    expect(JSON.parse((res as any)._getData())).toEqual({ error: 'Method Not Allowed' });
  });

  it('should return an error if the hub name is invalid', async () => {
    (req.body as any).hubName = 'invalid-hub-name';
    await handler(req, res);
    expect((res as any)._getStatusCode()).toBe(400);
    expect(JSON.parse((res as any)._getData())).toEqual({ error: 'Invalid hub name' });
  });

  it('should return an error if Azure Storage configuration is missing', async () => {
    const { AZURE_COSMOSDB_CONFIG: config } = require('@/constants/azureConstants');
    const originalConfig = { ...config };
    Object.assign(config, { notificationHubName: '', connectionString: '' });

    await handler(req, res);
    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({ error: 'Missing Azure Storage configuration' });

    // Restore original config
    Object.assign(config, originalConfig);
  });

  it('should return an error if an error occurs while generating the SAS token', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { generateBlobSASQueryParameters } = require('@azure/storage-blob');
    generateBlobSASQueryParameters.mockImplementationOnce(() => {
      throw new Error('Failed to generate SAS token');
    });

    await handler(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating SAS token:', expect.any(Error));
    expect((res as any)._getStatusCode()).toBe(500);
    expect(JSON.parse((res as any)._getData())).toEqual({ error: 'Failed to generate SAS token' });

    consoleErrorSpy.mockRestore();
  });
});
