/**
 * Application-wide constants
 * Centralized configuration to avoid magic numbers throughout the codebase
 */

// PDF Generation
export const PDF_CONSTANTS = {
  MAX_Y_POSITION: 270, // Maximum Y position before adding new page
  NEW_PAGE_START_Y: 20, // Y position to start on new page
};

// UI Display Limits
export const DISPLAY_LIMITS = {
  PREVIEW_ITEMS: 3, // Number of items to show in preview
  RECENT_ITEMS: 10, // Number of recent items to display
  INITIAL_LOAD: 20, // Initial number of items to load
  MAX_PAGINATION: 50, // Maximum items per page
};

// Calendar
export const CALENDAR_CONSTANTS = {
  MIN_CELL_HEIGHT_MOBILE: 120, // Minimum height for calendar cells on mobile
  MIN_CELL_HEIGHT_DESKTOP: 100, // Minimum height for calendar cells on desktop
  DAYS_IN_WEEK: 7,
  WEEKS_TO_DISPLAY: 6, // Typical calendar grid
};

// Subscription limits: see src/constants/subscriptionTiers.js

// Time Durations (milliseconds)
export const TIME_DURATIONS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Workload Thresholds
export const WORKLOAD_THRESHOLDS = {
  MAX_TIME_MINUTES: 180, // 3 hours
  WARNING_TIME_MINUTES: 120, // 2 hours
};

// Animation Delays
export const ANIMATION_DELAYS = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
};

// Input Validation
export const VALIDATION = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_EMAIL_LENGTH: 255,
};