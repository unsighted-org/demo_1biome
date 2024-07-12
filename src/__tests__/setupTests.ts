import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from '@jest/globals';
import { server } from '../mocks/server';

global.fetch = jest.fn<Promise<Response>, [URL | RequestInfo, RequestInit?]>(() =>
  Promise.resolve({
    json: () => Promise.resolve({ token: 'test-token' }),
  }) as Promise<Response>
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
