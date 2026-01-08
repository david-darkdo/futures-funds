/**
 * Numeric validation utilities for secure input handling.
 * Prevents NaN, Infinity, negative values, and extreme numbers.
 */

export interface ValidateNumberOptions {
  fieldName: string;
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowNegative?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Validates a numeric string input and returns a validated number.
 * Handles NaN, Infinity, negative values, and range checks.
 */
export function validateNumber(
  input: string,
  options: ValidateNumberOptions
): ValidationResult {
  const { fieldName, min, max, allowZero = false, allowNegative = false } = options;

  // Trim and check for empty
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} is required`,
    };
  }

  // Parse the number
  const parsed = parseFloat(trimmed);

  // Check for NaN
  if (isNaN(parsed)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be a valid number`,
    };
  }

  // Check for Infinity
  if (!isFinite(parsed)) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be a finite number`,
    };
  }

  // Check for negative (unless allowed)
  if (!allowNegative && parsed < 0) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} cannot be negative`,
    };
  }

  // Check for zero (unless allowed)
  if (!allowZero && parsed === 0) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be greater than zero`,
    };
  }

  // Check minimum
  if (min !== undefined && parsed < min) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must be at least ${min}`,
    };
  }

  // Check maximum
  if (max !== undefined && parsed > max) {
    return {
      isValid: false,
      value: 0,
      error: `${fieldName} must not exceed ${max}`,
    };
  }

  return {
    isValid: true,
    value: parsed,
  };
}

/**
 * Validates an optional numeric string input.
 * Returns null if input is empty, otherwise validates the number.
 */
export function validateOptionalNumber(
  input: string,
  options: ValidateNumberOptions
): ValidationResult & { value: number | null } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      isValid: true,
      value: null,
    };
  }

  const result = validateNumber(trimmed, options);
  return result;
}

/**
 * Constants for common validation limits
 */
export const VALIDATION_LIMITS = {
  CRYPTO_AMOUNT: {
    MIN: 0.000001,
    MAX: 100000000, // 100 million
  },
  WITHDRAWAL_AMOUNT: {
    MIN: 0.01,
    MAX: 10000000, // 10 million
  },
  BUNDLE_PRICE: {
    MIN: 1,
    MAX: 10000000, // 10 million
  },
  PERCENTAGE: {
    MIN: 0.01,
    MAX: 1000, // 1000% max change
  },
} as const;
