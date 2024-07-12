import { createSlice } from '@reduxjs/toolkit';

import type { UserState, UserSettings } from '@/types';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ExtendedUserState extends UserState {
  notifications: Notification[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
}

const initialState: ExtendedUserState = {
  _id: '',
  id: '',
  email: '',
  name: '',
  createdAt: '',
  dateOfBirth: '',
  height: 0,
  weight: 0,
  avatarUrl: null,
  connectedDevices: [],
  settings: {
    dateOfBirth: '',
    height: 0,
    weight: 0,
    connectedDevices: [],
    dailyReminder: true,
    weeklySummary: true,
    shareData: false,
    notificationsEnabled: true,
    dataRetentionPeriod: 365,
    notificationPreferences: {
      heartRate: false,
      stepGoal: false,
      environmentalImpact: false,
    },
  },
  fcmToken: null,
  token: '',
  enabled: false,
  notifications: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      return {
        ...state,
        ...action.payload,
        id: action.payload._id,
        createdAt: action.payload.createdAt,
        dateOfBirth: action.payload.dateOfBirth,
      };
    },
    updateUserProfile: (state, action: PayloadAction<Partial<Omit<UserState, 'id' | '_id' | 'email' | 'settings' | 'createdAt'>>>) => {
      return { ...state, ...action.payload };
    },
    updateSettings: (state, action: PayloadAction<Partial<Omit<UserSettings, '_id' | 'userId'>>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },
    addConnectedDevice: (state, action: PayloadAction<string>) => {
      if (!state.connectedDevices.includes(action.payload)) {
        state.connectedDevices.push(action.payload);
      }
      if (!state.settings.connectedDevices.includes(action.payload)) {
        state.settings.connectedDevices.push(action.payload);
      }
    },
    removeConnectedDevice: (state, action: PayloadAction<string>) => {
      state.connectedDevices = state.connectedDevices.filter((id) => id !== action.payload);
      state.settings.connectedDevices = state.settings.connectedDevices.filter((id) => id !== action.payload);
    },
    clearUser: () => initialState,
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'read'>>) => {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload,
        read: false,
      });
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setUser,
  updateUserProfile,
  updateSettings,
  setFCMToken,
  addConnectedDevice,
  removeConnectedDevice,
  clearUser,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
} = userSlice.actions;

export default userSlice.reducer;
