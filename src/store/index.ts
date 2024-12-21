import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import healthReducer, {
  updateHealthData,
  addHealthData,
  updateHealthScores,
  updateRegionalComparison,
  clearHealthData,
  triggerHealthNotification,
  triggerHealthAlert,
} from './healthSlice';
import userReducer, {
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
} from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    health: healthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'user/setUser',
          'health/updateHealthData',
          'health/addHealthData',
          'health/updateHealthScores',
          'health/updateRegionalComparison',
          'user/addNotification',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.dateOfBirth',
          'payload._id',
          'payload.connectedDevices',
          'payload.timestamp',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'user.createdAt',
          'user.dateOfBirth',
          'user._id',
          'user.connectedDevices',
          'user.settings.connectedDevices',
          'user.notifications',
          'health.lastSyncTime',
          'health.data',
          'health.scores',
          'health.regionalComparison',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Define custom useDispatch and useSelector hooks for better TypeScript inference
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Re-export actions
export {
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
  updateHealthData,
  addHealthData,
  updateHealthScores,
  updateRegionalComparison,
  clearHealthData,
  triggerHealthNotification,
  triggerHealthAlert,
};

// Define the AppThunk type for async actions
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
