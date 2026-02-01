// Security utilities for backend functions

// Rate limiting using in-memory store (simple implementation)
const rateLimitStore = new Map();

/**
 * Check if a user has exceeded the rate limit
 * @param {string} userId - User ID to check
 * @param {string} action - Action being rate limited (e.g., 'email_invitation')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} { allowed: boolean, remaining: number, resetTime: Date }
 */
export function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: new Date(now + windowMs) };
  }
  
  const record = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (now >= record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: new Date(now + windowMs) };
  }
  
  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: new Date(record.resetTime) 
    };
  }
  
  // Increment count
  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetTime: new Date(record.resetTime) 
  };
}

/**
 * Validate that a user has permission to access/modify an entity
 * @param {object} user - Current authenticated user
 * @param {string} entityFamilyId - Family ID of the entity being accessed
 * @param {string} requiredRole - Required role (optional, defaults to any authenticated user)
 * @returns {object} { valid: boolean, error: string | null }
 */
export function validateFamilyAccess(user, entityFamilyId, requiredRole = null) {
  if (!user) {
    return { valid: false, error: 'User not authenticated' };
  }
  
  const userFamilyId = user.data?.family_id || user.family_id;
  
  if (!userFamilyId) {
    return { valid: false, error: 'User is not part of a family' };
  }
  
  if (!entityFamilyId) {
    return { valid: false, error: 'Entity does not have a family_id' };
  }
  
  if (userFamilyId !== entityFamilyId) {
    return { valid: false, error: 'Access denied: Entity belongs to a different family' };
  }
  
  if (requiredRole) {
    const userRole = user.data?.family_role || user.family_role;
    if (userRole !== requiredRole) {
      return { valid: false, error: `Access denied: ${requiredRole} role required` };
    }
  }
  
  return { valid: true, error: null };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input to sanitize
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().slice(0, 10000); // Limit length and trim
}

/**
 * Check if user is a parent/admin
 * @param {object} user - User object
 * @returns {boolean}
 */
export function isParent(user) {
  const role = user?.data?.family_role || user?.family_role;
  return role === 'parent';
}

/**
 * Get user's family ID
 * @param {object} user - User object
 * @returns {string | null}
 */
export function getUserFamilyId(user) {
  return user?.data?.family_id || user?.family_id || null;
}