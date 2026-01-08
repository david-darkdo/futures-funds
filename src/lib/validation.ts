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
  WALLET_ADDRESS: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 256,
  },
  TRANSACTION_ID: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 256,
  },
} as const;

/**
 * Wallet address validation patterns by network
 */
const WALLET_PATTERNS: Record<string, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{40}$/,
  bsc: /^0x[a-fA-F0-9]{40}$/,
  polygon: /^0x[a-fA-F0-9]{40}$/,
  bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/,
  tron: /^T[a-zA-HJ-NP-Z0-9]{33}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};

/**
 * Transaction ID validation patterns by network
 */
const TXID_PATTERNS: Record<string, RegExp> = {
  ethereum: /^0x[a-fA-F0-9]{64}$/,
  bsc: /^0x[a-fA-F0-9]{64}$/,
  polygon: /^0x[a-fA-F0-9]{64}$/,
  bitcoin: /^[a-fA-F0-9]{64}$/,
  tron: /^[a-fA-F0-9]{64}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{87,88}$/,
};

export interface WalletValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue: string;
}

/**
 * Validates a wallet address for a specific network.
 * Returns sanitized value on success.
 */
export function validateWalletAddress(
  address: string,
  network: string
): WalletValidationResult {
  const trimmed = address.trim();

  // Check for empty
  if (!trimmed) {
    return {
      isValid: false,
      error: "Wallet address is required",
      sanitizedValue: "",
    };
  }

  // Check length limits
  if (trimmed.length < VALIDATION_LIMITS.WALLET_ADDRESS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Wallet address must be at least ${VALIDATION_LIMITS.WALLET_ADDRESS.MIN_LENGTH} characters`,
      sanitizedValue: trimmed,
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.WALLET_ADDRESS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Wallet address must not exceed ${VALIDATION_LIMITS.WALLET_ADDRESS.MAX_LENGTH} characters`,
      sanitizedValue: trimmed,
    };
  }

  // Check for dangerous characters (prevent injection)
  if (/[<>"'&;{}()\\]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Wallet address contains invalid characters",
      sanitizedValue: trimmed,
    };
  }

  // Check format for known networks
  const pattern = WALLET_PATTERNS[network.toLowerCase()];
  if (pattern && !pattern.test(trimmed)) {
    return {
      isValid: false,
      error: `Invalid wallet address format for ${network}`,
      sanitizedValue: trimmed,
    };
  }

  return {
    isValid: true,
    sanitizedValue: trimmed,
  };
}

/**
 * Validates a transaction ID for a specific network.
 * Returns sanitized value on success.
 */
export function validateTransactionId(
  txid: string,
  network?: string
): WalletValidationResult {
  const trimmed = txid.trim();

  // Empty is allowed for optional fields
  if (!trimmed) {
    return {
      isValid: true,
      sanitizedValue: "",
    };
  }

  // Check length limits
  if (trimmed.length < VALIDATION_LIMITS.TRANSACTION_ID.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Transaction ID must be at least ${VALIDATION_LIMITS.TRANSACTION_ID.MIN_LENGTH} characters`,
      sanitizedValue: trimmed,
    };
  }

  if (trimmed.length > VALIDATION_LIMITS.TRANSACTION_ID.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Transaction ID must not exceed ${VALIDATION_LIMITS.TRANSACTION_ID.MAX_LENGTH} characters`,
      sanitizedValue: trimmed,
    };
  }

  // Check for dangerous characters (prevent injection)
  if (/[<>"'&;{}()\\]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Transaction ID contains invalid characters",
      sanitizedValue: trimmed,
    };
  }

  // Check format for known networks if provided
  if (network) {
    const pattern = TXID_PATTERNS[network.toLowerCase()];
    if (pattern && !pattern.test(trimmed)) {
      return {
        isValid: false,
        error: `Invalid transaction ID format for ${network}`,
        sanitizedValue: trimmed,
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: trimmed,
  };
}
