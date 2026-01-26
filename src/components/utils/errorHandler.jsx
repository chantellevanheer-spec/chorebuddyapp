/**
 * Unified error handling utilities
 * Provides consistent error handling and user feedback across the app
 */
import { toast } from "sonner";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Handle API errors and convert them to AppError instances
 * @param {Error} error - The error to handle
 * @param {string} context - Context where the error occurred (for logging)
 * @returns {AppError} - Standardized AppError instance
 */
export const handleApiError = (error, context = '') => {
  console.error(`[${context}] Error:`, error);
  
  // Handle different error types
  if (error.response) {
    // API returned error response
    const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
    return new AppError(message, error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    return new AppError('No response from server. Please check your connection.', 'NETWORK_ERROR');
  } else if (error instanceof AppError) {
    // Already handled
    return error;
  } else {
    // Something else happened
    return new AppError(error.message || 'An unexpected error occurred', 'UNKNOWN_ERROR');
  }
};

/**
 * Display error toast notification to user
 * @param {Error|AppError} error - The error to display
 * @param {string} defaultMessage - Default message if error has no message
 */
export const showErrorToast = (error, defaultMessage = 'An error occurred') => {
  const appError = error instanceof AppError ? error : handleApiError(error);
  
  toast.error(appError.message || defaultMessage, {
    description: appError.code ? `Error code: ${appError.code}` : undefined,
    duration: 5000
  });
};

/**
 * Wrapper for async operations with standardized error handling
 * @param {Function} operation - Async function to execute
 * @param {string} context - Context for error logging
 * @param {string} errorMessage - User-facing error message
 * @returns {Promise<any>} - Result of the operation or null on error
 */
export const withErrorHandling = async (operation, context, errorMessage) => {
  try {
    return await operation();
  } catch (error) {
    const appError = handleApiError(error, context);
    showErrorToast(appError, errorMessage);
    return null;
  }
};