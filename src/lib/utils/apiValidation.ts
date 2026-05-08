/**
 * API Response Validation Utilities
 * Provides type-safe validation for API responses
 */

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Validates that data is not null/undefined
 */
export function validateDataExists<T>(data: T | null | undefined, errorMessage = 'Data not found'): ValidationResult<T> {
  if (data === null || data === undefined) {
    return { success: false, error: errorMessage }
  }
  return { success: true, data }
}

/**
 * Validates that data is an array
 */
export function validateArray<T>(data: unknown, errorMessage = 'Expected an array'): ValidationResult<T[]> {
  if (!Array.isArray(data)) {
    return { success: false, error: errorMessage }
  }
  return { success: true, data: data as T[] }
}

/**
 * Validates that data is an object
 */
export function validateObject<T extends Record<string, unknown>>(
  data: unknown,
  errorMessage = 'Expected an object'
): ValidationResult<T> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { success: false, error: errorMessage }
  }
  return { success: true, data: data as T }
}

/**
 * Validates Supabase response structure
 */
export function validateSupabaseResponse<T>(
  data: T | null | undefined,
  error: { message?: string; code?: string } | null,
  errorMessage = 'Request failed'
): ValidationResult<T> {
  if (error) {
    return {
      success: false,
      error: error.message || errorMessage,
    }
  }

  return validateDataExists(data, errorMessage)
}

/**
 * Validates that a required field exists in an object
 */
export function validateRequiredField<T extends Record<string, unknown>>(
  obj: T,
  field: keyof T,
  errorMessage?: string
): ValidationResult<T> {
  if (!obj[field]) {
    return {
      success: false,
      error: errorMessage || `Missing required field: ${String(field)}`,
    }
  }
  return { success: true, data: obj }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email address' }
  }
  return { success: true, data: email }
}

/**
 * Validates string length
 */
export function validateStringLength(
  str: string,
  min: number,
  max: number,
  fieldName = 'Field'
): ValidationResult<string> {
  if (str.length < min) {
    return { success: false, error: `${fieldName} must be at least ${min} characters` }
  }
  if (str.length > max) {
    return { success: false, error: `${fieldName} must be at most ${max} characters` }
  }
  return { success: true, data: str }
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T>(json: string, errorMessage = 'Invalid JSON'): ValidationResult<T> {
  try {
    const parsed = JSON.parse(json) as T
    return { success: true, data: parsed }
  } catch {
    return { success: false, error: errorMessage }
  }
}
