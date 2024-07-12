// src/lib/userUtils.ts
import type { ServerUser, ServerUserSettings, UserState } from '../types';

interface UserResponse extends UserState {
  notifications: any[];
}

export function convertToUserState(serverUser: ServerUser, serverSettings: ServerUserSettings | null, token: string): UserResponse {
  const settings = serverSettings 
    ? {
        dateOfBirth: serverSettings.dateOfBirth ? serverSettings.dateOfBirth.toISOString() : undefined,
        height: serverSettings.height,
        weight: serverSettings.weight,
        connectedDevices: serverSettings.connectedDevices.map(id => id.toString()),
        dailyReminder: serverSettings.dailyReminder,
        weeklySummary: serverSettings.weeklySummary,
        shareData: serverSettings.shareData,
        notificationsEnabled: serverSettings.notificationsEnabled,
        notificationPreferences: serverSettings.notificationPreferences,
        dataRetentionPeriod: serverSettings.dataRetentionPeriod
      }
    : {
        connectedDevices: [],
        dailyReminder: false,
        weeklySummary: false,
        shareData: false,
        notificationsEnabled: false,
        dataRetentionPeriod: 0,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      };

  return {
    _id: serverUser._id.toString(),
    id: serverUser._id.toString(),
    email: serverUser.email,
    name: serverUser.name,
    createdAt: serverUser.createdAt.toISOString(),
    dateOfBirth: serverUser.dateOfBirth.toISOString(),
    height: serverUser.height,
    weight: serverUser.weight,
    avatarUrl: serverUser.avatarUrl,
    connectedDevices: serverUser.connectedDevices.map(id => id.toString()),
    settings,
    fcmToken: null,
    token,
    enabled: true,
    notifications: []
  };
}