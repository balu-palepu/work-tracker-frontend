/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Escape HTML special characters
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * Remove potentially dangerous characters from input
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;

  // Remove script tags and event handlers
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=\s*/gi, '')
    .replace(/onclick\s*=\s*/gi, '');
};

/**
 * Sanitize object properties recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with strength and errors
 */
export const validatePassword = (password) => {
  const errors = [];
  let strength = 0;

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    strength += 1;
  }

  if (password.length >= 12) {
    strength += 1;
  }

  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (/[0-9]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Password must contain at least one number');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Password must contain at least one special character');
  }

  const strengthLevels = ['weak', 'weak', 'fair', 'good', 'strong', 'very strong'];

  return {
    isValid: errors.length === 0 && password.length >= 8,
    strength: strengthLevels[Math.min(strength, 5)],
    errors,
  };
};

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 255);
};

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 * @param {string} url - URL to sanitize
 * @param {Array<string>} allowedDomains - List of allowed domains
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url, allowedDomains = []) => {
  if (typeof url !== 'string') return null;

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    // Check if domain is allowed (if allowedDomains specified)
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );

      if (!isAllowed) {
        return null;
      }
    }

    return parsedUrl.href;
  } catch (e) {
    return null;
  }
};

/**
 * Remove leading/trailing whitespace and collapse multiple spaces
 * @param {string} str - String to trim
 * @returns {string} - Trimmed string
 */
export const trimAndCollapse = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/\s+/g, ' ');
};

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  validatePassword,
  sanitizeFilename,
  sanitizeUrl,
  trimAndCollapse,
};
