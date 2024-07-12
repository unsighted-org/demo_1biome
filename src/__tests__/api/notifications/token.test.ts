import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import handler from '../../../pages/api/notifications/token';
import { createMocks, MockRequest, MockResponse } from 'node-mocks-http';
import { azureStorageConfig } from '@/config/azureBlobStorage';
// import { azureConfig } from '@/config/azureConfig';

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

jest.mock('@/config/azureConfig', () => ({
  azureConfig: {
    notificationHubName: 'notification-hub',
    connectionString: 'test-connection-string',
  },
}));

jest.mock('@/config/azureBlobStorage', () => ({
  azureStorageConfig: {
    accountName: 'your-account-name',
    accountKey: 'your-account-key',
    containerName: 'your-container-name',
  },
}));

describe('Token API', () => {
  let req: MockRequest<any>;
  let res: MockResponse<any>;

  beforeEach(() => {
    const { req: request, res: response } = createMocks({
      method: 'POST',
      body: {
        hubName: 'notification-hub',
      },
    });
    req = request;
    res = response;
  });

  it('should return a valid SAS token', async () => {
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ token: 'mocked-sas-token' });
  });

  it('should return an error if the method is not POST', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.statusCode).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method Not Allowed' });
  });

  it('should return an error if the hub name is invalid', async () => {
    req.body.hubName = 'invalid-hub-name';
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toEqual({ error: 'Invalid hub name' });
  });

  it('should return an error if Azure Storage configuration is missing', async () => {
    const originalConfig = { ...azureStorageConfig };
    Object.assign(azureStorageConfig, { accountName: '', accountKey: '', containerName: '' });

    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Missing Azure Storage configuration' });

    // Restore original config
    Object.assign(azureStorageConfig, originalConfig);
  });

  it('should return an error if an error occurs while generating the SAS token', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { generateBlobSASQueryParameters } = require('@azure/storage-blob');
    generateBlobSASQueryParameters.mockImplementationOnce(() => {
      throw new Error('Failed to generate SAS token');
    });

    await handler(req, res);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating SAS token:', expect.any(Error));
    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toEqual({ error: 'Failed to generate SAS token' });

    consoleErrorSpy.mockRestore();
  });
});
