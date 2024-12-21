import dotenv from 'dotenv';
dotenv.config();

// Application constants
export const APP_NAME = '1Biome';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const SOCKET_PATH = '/api/socketio';

// Function to get the current base URL
export const getCurrentBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return API_BASE_URL;
};

// User input constraints
export const MAX_WEIGHT = 500; // in kg
export const MIN_WEIGHT = 20; // in kg

// Cache settings
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
export const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds
export const MAX_CACHE_SIZE = 5;

// Pagination and data limits
export const MAX_PAGES = 5;
export const MAX_DATA_POINTS = 1000;
export const MAX_DATA_POINTS_PER_PAGE = 200;
export const MAX_DATA_POINTS_PER_REQUEST = 100;

// Rate limiting
export const MAX_DATA_POINTS_PER_SECOND = 10;

// Network request settings
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second

// Health data API constants
export const TOTAL_MOCK_DATA = 100;
export const PAGE_SIZE = 50;
export const SOCKET_UPDATE_INTERVAL = 5000; // 5 seconds

// Add any other constants here...
