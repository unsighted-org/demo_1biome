import { notificationService } from '@/services/NotificationService';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { store, setFCMToken } from '@/store';

jest.mock('@/store', () => ({
  store: {
    dispatch: jest.fn(),
  },
  setFCMToken: jest.fn(),
}));

type MockFetchResponse = {
  ok: boolean;
  json: () => Promise<any>;
  text?: () => Promise<string>;
};

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('NotificationService', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });

  afterAll(() => server.close());

  const mockUser = {
    id: 'test-user',
    token: 'user-token',
    _id: '',
    email: '',
    name: '',
    createdAt: '',
    dateOfBirth: '',
    height: 0,
    weight: 0,
    avatarUrl: null,
    connectedDevices: [],
    settings: {
      connectedDevices: [],
      dailyReminder: false,
      weeklySummary: false,
      shareData: false,
      notificationsEnabled: false,
      notificationPreferences: {
        heartRate: false,
        stepGoal: false,
        environmentalImpact: false
      },
      dataRetentionPeriod: 0
    },
    fcmToken: null,
    enabled: false
  };

  it('should get token successfully', async () => {
    server.use(
      rest.get('/api/token', (req, res, ctx) => {
        return res(
          ctx.json({ token: 'test-token' })
        );
      })
    );

    notificationService.setAuthContext(mockUser as any, 'user-token');
    const token = await notificationService.getTokenWithRetry();
    expect(token).toBe('test-token');
  });

  it('should handle token fetch failure gracefully', async () => {
    server.use(
      rest.get('/api/token', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal Server Error' })
        );
      })
    );

    notificationService.setAuthContext(mockUser as any, 'user-token');
    await expect(notificationService.getTokenWithRetry()).rejects.toThrow('Internal Server Error');
  });

  it('should register for push notifications successfully', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test-token',
      }),
    } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
      } as MockFetchResponse);  


    notificationService.setAuthContext(mockUser as any, 'user-token');
    await notificationService.init();
    expect(store.dispatch).toHaveBeenCalledWith(setFCMToken('test-token'));
  });

  it('should handle registration failure', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'test-token' }),
      } as MockFetchResponse)
      .mockResolvedValueOnce({
        ok: false,
        text: async () => 'Registration failed',
      } as MockFetchResponse);

    notificationService.setAuthContext(mockUser as any, 'user-token');
    await expect(notificationService.init()).rejects.toThrow('Failed to register with Azure Notification Hubs: Registration failed');
  });

  it('should update user preferences', () => {
    const newPreferences = {
      heartRate: true,
      stepGoal: true,
      environmentalImpact: true
    };
    notificationService.setAuthContext(mockUser as any, 'user-token');
    notificationService.updateUserPreferences(newPreferences);
    expect(notificationService['user']?.settings.notificationPreferences).toEqual(newPreferences);
  });

  it('should handle notifications', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const notification = { title: 'Test', message: 'This is a test notification' };
    notificationService.handleNotification(notification);
    expect(consoleSpy).toHaveBeenCalledWith('Received notification:', notification);
    expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
  });
});
