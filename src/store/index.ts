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
import { NotificationService } from '@/services/NotificationService';

export const store = configureStore({
  reducer: {
    user: userReducer,
    health: healthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'user/setUser',
          'health/updateHealthData',
          'health/addHealthData',
          'health/updateHealthScores',
          'health/updateRegionalComparison',
          'user/addNotification',
        ],
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.dateOfBirth',
          'payload._id',
          'payload.connectedDevices',
          'payload.timestamp',
        ],
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

export const notificationService = new NotificationService(
  (token: string) => store.dispatch(setFCMToken(token)),
  (notification: { title: string; message: string }) => store.dispatch(addNotification(notification))
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;