import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import notificationService from '@/services/CustomNotificationService';

type MockFetchInit = {
  ok?: boolean;
  jsonData?: any;
  textData?: string;
};

class MockFetchResponse {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  private readonly _jsonData?: any;
  private readonly _textData?: string;
  private readonly _bytes: Uint8Array;

  constructor(init: MockFetchInit) {
    this.ok = init.ok ?? true;
    this._jsonData = init.jsonData;
    this._textData = init.textData;
    this._bytes = new Uint8Array();
    this.headers = new Headers();
    this.redirected = false;
    this.status = init.ok ? 200 : 400;
    this.statusText = init.ok ? 'OK' : 'Bad Request';
    this.type = 'default';
    this.url = 'http://localhost';
    this.body = null;
    this.bodyUsed = false;
  }

  async json(): Promise<any> {
    if (this._jsonData !== undefined) return this._jsonData;
    throw new Error('No JSON data available');
  }

  async text(): Promise<string> {
    if (this._textData !== undefined) return this._textData;
    throw new Error('No text data available');
  }

  async bytes(): Promise<Uint8Array> {
    return this._bytes;
  }

  clone(): MockFetchResponse {
    return new MockFetchResponse({
      ok: this.ok,
      jsonData: this._jsonData,
      textData: this._textData
    });
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this._bytes.length);
    new Uint8Array(buffer).set(this._bytes);
    return buffer;
  }

  async blob(): Promise<Blob> {
    return new Blob([this._bytes]);
  }

  async formData(): Promise<FormData> {
    return new FormData();
  }
}

describe('NotificationService', () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  it('should register for notifications successfully', async () => {
    const mockResponse = new MockFetchResponse({
      ok: true,
      jsonData: { token: 'test-token' }
    });
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const result = await notificationService.register();
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle registration failure', async () => {
    const mockResponse = new MockFetchResponse({
      ok: false,
      textData: 'Registration failed'
    });
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const result = await notificationService.register();
    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should unregister from notifications successfully', async () => {
    const mockResponse = new MockFetchResponse({
      ok: true
    });
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const result = await notificationService.unregister();
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle unregistration failure', async () => {
    const mockResponse = new MockFetchResponse({
      ok: false,
      textData: 'Unregistration failed'
    });
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as unknown as Response);

    const result = await notificationService.unregister();
    expect(result).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
