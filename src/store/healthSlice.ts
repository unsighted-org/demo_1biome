import { createSlice, createAction, PayloadAction } from '@reduxjs/toolkit';
import type { HealthEnvironmentData, HealthState, HealthScore, RegionalComparison } from '@/types';

const initialState: HealthState = {
  data: [],
  lastSyncTime: null,
  scores: null,
  regionalComparison: null,
  loading: false,
  error: null
};

// Create actions for triggering notifications
export const triggerHealthNotification = createAction<{ title: string; message: string }>('health/triggerNotification');
export const triggerHealthAlert = createAction<{ title: string; message: string }>('health/triggerAlert');

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    updateHealthData: (state, action: PayloadAction<HealthEnvironmentData[]>) => {
      state.data = action.payload;
      state.lastSyncTime = new Date().toISOString();
    },
    addHealthData: (state, action: PayloadAction<HealthEnvironmentData>) => {
      state.data.push(action.payload);
      state.lastSyncTime = new Date().toISOString();
    },
    updateHealthScores: (state, action: PayloadAction<HealthScore>) => {
      state.scores = action.payload;
    },
    updateRegionalComparison: (state, action: PayloadAction<RegionalComparison>) => {
      state.regionalComparison = action.payload;
    },
    clearHealthData: (state) => {
      state.data = [];
      state.lastSyncTime = null;
      state.scores = null;
      state.regionalComparison = null;
    },
  },
});

export const {
  updateHealthData,
  addHealthData,
  updateHealthScores,
  updateRegionalComparison,
  clearHealthData
} = healthSlice.actions;

export default healthSlice.reducer;
