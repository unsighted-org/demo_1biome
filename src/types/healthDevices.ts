// Common types for health device integrations
export type TimeUnit = 'seconds' | 'minutes' | 'hours';
export type DistanceUnit = 'meters' | 'kilometers' | 'miles';
export type WeightUnit = 'kg' | 'lbs';
export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Apple HealthKit Types
export interface HealthKitPermissions {
  authorized: boolean;
}

export interface HealthKitWorkout {
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  energyBurned: number;
  distance?: number;
  averageHeartRate?: number;
}

export interface HealthKitSleepAnalysis {
  startDate: string;
  endDate: string;
  value: 'INBED' | 'ASLEEP' | 'AWAKE';
  sourceName: string;
  sourceId: string;
}

export interface HealthKitData {
  steps: number;
  heartRate: {
    value: number;
    startDate: string;
    endDate: string;
  }[];
  activeEnergy: number;
  sleepAnalysis: HealthKitSleepAnalysis[];
  workout: HealthKitWorkout[];
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    timestamp: string;
  }[];
  respiratoryRate?: {
    value: number;
    timestamp: string;
  }[];
  oxygenSaturation?: {
    value: number;
    timestamp: string;
  }[];
  bodyTemperature?: {
    value: number;
    unit: TemperatureUnit;
    timestamp: string;
  }[];
  weight?: {
    value: number;
    unit: WeightUnit;
    timestamp: string;
  }[];
  height?: {
    value: number;
    unit: DistanceUnit;
    timestamp: string;
  }[];
}

// Oura Ring Types
export interface OuraReadiness {
  score: number;
  temperature_deviation?: number;
  temperature_trend_deviation?: number;
  previous_night_score: number;
  sleep_balance: number;
  previous_day_activity: number;
  activity_balance: number;
  resting_heart_rate: number;
  heart_rate_variability_balance: number;
  recovery_index: number;
}

export interface OuraSleep {
  summary_date: string;
  period_id: number;
  is_longest: number;
  timezone: number;
  bedtime_start: string;
  bedtime_end: string;
  score: number;
  score_total: number;
  score_disturbances: number;
  score_efficiency: number;
  score_latency: number;
  score_rem: number;
  score_deep: number;
  score_alignment: number;
  total: number;
  duration: number;
  awake: number;
  light: number;
  rem: number;
  deep: number;
  onset_latency: number;
  restless: number;
  efficiency: number;
  midpoint_time: number;
  hr_lowest: number;
  hr_average: number;
  rmssd: number;
  breath_average: number;
  temperature_delta: number;
  hypnogram_5min: string;
  hr_5min: number[];
  rmssd_5min: number[];
}

export interface OuraActivity {
  summary_date: string;
  timezone: number;
  score: number;
  score_stay_active: number;
  score_move_every_hour: number;
  score_meet_daily_targets: number;
  score_training_frequency: number;
  score_training_volume: number;
  score_recovery_time: number;
  daily_movement: number;
  non_wear: number;
  rest: number;
  inactive: number;
  inactivity_alerts: number;
  low: number;
  medium: number;
  high: number;
  steps: number;
  cal_total: number;
  cal_active: number;
  met_min_inactive: number;
  met_min_low: number;
  met_min_medium_plus: number;
  met_min_medium: number;
  met_min_high: number;
  average_met: number;
  class_5min: string;
  met_1min: number[];
}

export interface OuraRingData {
  readiness: OuraReadiness;
  sleep: OuraSleep;
  activity: OuraActivity;
}
