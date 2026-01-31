/**
 * Input Validation Utilities
 *
 * Provides validation functions for user inputs
 * to prevent injection attacks and ensure data integrity
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const validatePassword = (
  password: string,
): {
  isValid: boolean;
  message?: string;
} => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'La contraseña debe tener al menos 8 caracteres',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una mayúscula',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos una minúscula',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'La contraseña debe contener al menos un número',
    };
  }

  return { isValid: true };
};

/**
 * Validate numeric price/amount
 */
export const validatePrice = (price: string): boolean => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice > 0 && isFinite(numPrice);
};

/**
 * Validate positive integer
 */
export const validatePositiveInteger = (value: string): boolean => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate currency symbol code (3 uppercase letters)
 */
export const validateCurrencyCode = (code: string): boolean => {
  return /^[A-Z]{3}$/.test(code);
};

/**
 * Validate phone number (basic international format)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Check if it's between 10 and 15 digits, optionally starting with +
  return /^\+?\d{10,15}$/.test(cleaned);
};

/**
 * Validate URL format
 */
export const validateURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.href.split(':')[0];
    return protocol === 'http' || protocol === 'https';
  } catch {
    return false;
  }
};

/**
 * Validate percentage (0-100)
 */
export const validatePercentage = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * Validate date is not in the past
 */
export const validateFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

/**
 * Sanitize and validate search query
 */
export const validateSearchQuery = (
  query: string,
): {
  isValid: boolean;
  sanitized: string;
} => {
  const sanitized = sanitizeInput(query);

  // Prevent excessively long queries
  if (sanitized.length > 100) {
    return { isValid: false, sanitized: sanitized.substring(0, 100) };
  }

  // Prevent SQL-like injection attempts
  if (/(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i.test(sanitized)) {
    return { isValid: false, sanitized: '' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate complete user registration form
 */
export const validateRegistrationForm = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!validateEmail(data.email)) {
    errors.push('Email inválido');
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid && passwordValidation.message) {
    errors.push(passwordValidation.message);
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }

  if (data.displayName) {
    const sanitizedName = sanitizeInput(data.displayName);
    if (sanitizedName.length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }
    if (sanitizedName.length > 50) {
      errors.push('El nombre no puede exceder 50 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate alert creation form
 */
export const validateAlertForm = (data: {
  targetPrice: string;
  condition: 'above' | 'below';
}): ValidationResult => {
  const errors: string[] = [];

  if (!validatePrice(data.targetPrice)) {
    errors.push('El precio objetivo debe ser un número positivo válido');
  }

  if (!['above', 'below'].includes(data.condition)) {
    errors.push('Condición de alerta inválida');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
