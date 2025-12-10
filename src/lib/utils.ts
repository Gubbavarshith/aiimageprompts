import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and escapes special characters
 * @param input - The user input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape special characters that could be used for XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  return sanitized.trim()
}

/**
 * Sanitizes user input for database storage
 * Removes HTML tags but preserves line breaks and basic formatting
 * @param input - The user input string to sanitize
 * @returns Sanitized string safe for database storage
 */
export function sanitizeForStorage(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remove other potentially dangerous tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  return sanitized.trim()
}

