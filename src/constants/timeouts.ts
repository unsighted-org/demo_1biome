export const LOADING_TIMEOUTS = {
  // Pages
  GLOBE_SCREEN: 15000,    // 15s for complex globe page
  STATS_PAGE: 10000,      // 10s for stats and charts
  SETTINGS_PAGE: 8000,    // 8s for settings updates
  PROFILE_PAGE: 5000,     // 5s for profile data
  DELETE_ACCOUNT: 10000,  // 10s for account deletion

  // Components
  HEALTH_TREND_CHART: 12000,  // 12s for complex chart data
  ANIMATED_GLOBE: 20000,      // 20s for 3D globe initialization

  // Default timeouts
  DEFAULT_API_TIMEOUT: 10000,  // 10s default for API calls
  DEFAULT_UI_TIMEOUT: 5000,    // 5s default for UI operations
} as const;

// Helper function to get timeout with fallback
export const getTimeout = (key: keyof typeof LOADING_TIMEOUTS): number => {
  return LOADING_TIMEOUTS[key] || LOADING_TIMEOUTS.DEFAULT_API_TIMEOUT;
};
