/**
 * Sanitization utilities for user-generated content
 * Prevents XSS attacks by escaping HTML entities
 */

/**
 * Comprehensive HTML sanitization to prevent XSS attacks
 * Escapes all potentially dangerous characters including quotes and slashes
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string safe for rendering
 */
export function sanitizeHTML(str) {
  if (!str) return '';
  
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  
  return String(str).replace(/[&<>"'/]/g, (char) => entityMap[char]);
}

/**
 * Sanitize and truncate text for display
 * @param {string} str - The string to sanitize
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Sanitized and truncated string
 */
export function sanitizeAndTruncate(str, maxLength = 200) {
  const sanitized = sanitizeHTML(str);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength) + '...';
}

/**
 * Sanitize URL to prevent javascript: protocol and other malicious URLs
 * @param {string} url - The URL to sanitize
 * @returns {string} - Safe URL or empty string if malicious
 */
export function sanitizeURL(url) {
  if (!url) return '';
  
  const lowerUrl = url.toLowerCase().trim();
  
  // Block dangerous protocols
  if (lowerUrl.startsWith('javascript:') || 
      lowerUrl.startsWith('data:') || 
      lowerUrl.startsWith('vbscript:')) {
    return '';
  }
  
  return url;
}