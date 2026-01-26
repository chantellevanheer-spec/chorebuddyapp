/**
 * Input validation utilities with consistent error messages
 * Uses constants from appConstants.js for limits
 */
import { VALIDATION } from '@/components/lib/appConstants';

/**
 * Validate name fields (person names, chore titles, etc.)
 */
export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.length > VALIDATION.MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters` };
  }
  
  // Only allow letters, numbers, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
};

/**
 * Validate description fields
 */
export const validateDescription = (desc) => {
  if (!desc) return { valid: true }; // Optional field
  
  if (desc.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return { 
      valid: false, 
      error: `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters` 
    };
  }
  
  return { valid: true };
};

/**
 * Validate notes fields (completion notes, admin notes, etc.)
 */
export const validateNotes = (notes) => {
  if (!notes) return { valid: true }; // Optional field
  
  if (notes.length > VALIDATION.MAX_NOTES_LENGTH) {
    return { 
      valid: false, 
      error: `Notes must be less than ${VALIDATION.MAX_NOTES_LENGTH} characters` 
    };
  }
  
  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (email.length > VALIDATION.MAX_EMAIL_LENGTH) {
    return { valid: false, error: `Email must be less than ${VALIDATION.MAX_EMAIL_LENGTH} characters` };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

/**
 * Validate numeric input (points, costs, time estimates)
 */
export const validateNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER, fieldName = 'Value') => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  
  if (num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }
  
  return { valid: true };
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
  if (!url) return { valid: true }; // Optional field
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
};