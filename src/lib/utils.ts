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

/**
 * Converts image ratio string to Tailwind CSS aspect ratio class
 * @param ratio - Image ratio string (e.g., '16:9', '1:1')
 * @returns Tailwind aspect ratio class
 */
export function getAspectRatioClass(ratio: string | null | undefined): string {
  if (!ratio) {
    return 'aspect-[4/3]' // Default fallback
  }

  const ratioMap: Record<string, string> = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '21:9': 'aspect-[21/9]',
    '3:2': 'aspect-[3/2]',
    '2:3': 'aspect-[2/3]',
  }

  return ratioMap[ratio] || 'aspect-[4/3]'
}

/**
 * Available image ratio options
 */
export const IMAGE_RATIOS = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
  { value: '3:2', label: '3:2 (Classic)' },
  { value: '2:3', label: '2:3 (Portrait)' },
] as const

/**
 * Standard ratio values mapped to their numeric aspect ratios
 */
const RATIO_VALUES: Record<string, number> = {
  '1:1': 1.0,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '21:9': 21 / 9,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
}

/**
 * Detects the closest matching image ratio based on image dimensions
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns The closest matching ratio string (e.g., '16:9')
 */
export function detectImageRatio(width: number, height: number): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return '4:3' // Default fallback
  }

  const actualRatio = width / height
  let closestRatio = '4:3' // Default
  let smallestDifference = Infinity

  // Find the ratio with the smallest difference
  for (const [ratio, ratioValue] of Object.entries(RATIO_VALUES)) {
    const difference = Math.abs(actualRatio - ratioValue)
    if (difference < smallestDifference) {
      smallestDifference = difference
      closestRatio = ratio
    }
  }

  return closestRatio
}

/**
 * Loads an image and detects its ratio
 * @param imageSource - Image URL or File object
 * @returns Promise that resolves to the detected ratio string
 */
export function detectImageRatioFromSource(
  imageSource: string | File
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const detectedRatio = detectImageRatio(img.naturalWidth, img.naturalHeight)
      resolve(detectedRatio)
    }

    img.onerror = () => {
      // Fallback to default if image fails to load
      resolve('4:3')
    }

    if (typeof imageSource === 'string') {
      // URL string
      img.src = imageSource
    } else {
      // File object
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string
        } else {
          resolve('4:3')
        }
      }
      reader.onerror = () => {
        resolve('4:3')
      }
      reader.readAsDataURL(imageSource)
    }
  })
}

/**
 * Parse CSV text into array of objects
 * Handles semicolon-separated tags and quoted fields
 * @param csvText - CSV file content as string
 * @returns Array of objects with parsed data
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return [] // Need at least header + one data row

  // Parse header
  const headers = parseCSVLine(lines[0])
  const result: any[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: any = {}

    headers.forEach((header, index) => {
      let value = values[index] || ''
      value = value.trim()

      // Map field names
      if (header === 'preview_image') {
        row.preview_image_url = value
      } else if (header === 'tags') {
        // Handle semicolon-separated tags
        row.tags = value ? value.split(';').map((t: string) => t.trim()).filter(Boolean) : []
      } else {
        row[header] = value
      }
    })

    result.push(row)
  }

  return result
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current)
  return result
}

/**
 * Validate a bulk upload prompt object
 * @param data - Prompt data object from JSON/CSV
 * @param validCategories - Array of valid category names (deprecated - no longer used for validation)
 * @returns Array of validation error messages (empty if valid)
 */
export function validateBulkPrompt(data: any, _validCategories?: string[]): string[] {
  const errors: string[] = []

  // Required fields
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('Title is required')
  }

  if (!data.prompt || typeof data.prompt !== 'string' || !data.prompt.trim()) {
    errors.push('Prompt is required')
  }

  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.push('Category is required')
  }
  // Note: Categories don't need to exist beforehand - they will be created automatically when prompts are published

  // Optional field validations
  if (data.preview_image_url && typeof data.preview_image_url === 'string') {
    try {
      new URL(data.preview_image_url)
    } catch {
      errors.push('Invalid preview_image_url format')
    }
  }

  if (data.attribution_link && typeof data.attribution_link === 'string') {
    try {
      new URL(data.attribution_link)
    } catch {
      errors.push('Invalid attribution_link format')
    }
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array')
  }

  // Status validation
  if (data.status && !['Published', 'Draft', 'Review', 'Pending', 'Rejected', 'draft'].includes(data.status)) {
    errors.push('Invalid status value')
  }

  return errors
}

/**
 * Normalize bulk upload data to match PromptPayload format
 * @param data - Raw data from JSON/CSV
 * @param detectedRatio - Auto-detected image ratio
 * @returns Normalized PromptPayload object
 */
export function normalizeBulkPrompt(data: any, detectedRatio: string = '4:3', status: string = 'Published'): any {
  return {
    title: sanitizeForStorage((data.title || '').trim()),
    prompt: sanitizeForStorage((data.prompt || '').trim()),
    negative_prompt: data.negative_prompt ? sanitizeForStorage(data.negative_prompt.trim()) : null,
    category: sanitizeForStorage((data.category || '').trim()),
    tags: data.tags && Array.isArray(data.tags) && data.tags.length > 0
      ? data.tags.map((tag: string) => sanitizeForStorage(tag.trim().toLowerCase())).filter(Boolean)
      : null,
    preview_image_url: data.preview_image_url || data.preview_image || null,
    status: status, // Use provided status (default: 'Published')
    views: 0,
    user_id: null,
    attribution: data.attribution ? sanitizeForStorage(data.attribution.trim()) : null,
    attribution_link: data.attribution_link || null,
    image_ratio: detectedRatio,
  }
}

