import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

const TABLE_NAME = 'prompts'

// Default fallback categories if database is empty
const DEFAULT_CATEGORIES = [
  'Portraits',
  'Anime',
  'Logos',
  'UI/UX',
  'Cinematic',
  '3D Art',
  'Photography',
  'Illustrations',
]

export type CategoryWithCount = {
  category: string
  count: number
}

export type TagWithCount = {
  tag: string
  count: number
}

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T> | undefined): boolean {
  if (!entry) return false
  return Date.now() - entry.timestamp < entry.ttl
}

/**
 * Get cached data or null if expired
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (isCacheValid(entry)) {
    return entry!.data
  }
  cache.delete(key)
  return null
}

/**
 * Set cache data
 */
function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Invalidate cache for a specific key
 */
export function invalidateCategoryCache(): void {
  cache.delete('categories')
  cache.delete('categories-with-counts')
  cache.delete('popular-tags')
}

/**
 * Fetch unique categories from published prompts
 * Returns categories sorted by usage count (most popular first), then alphabetically
 */
export async function fetchUniqueCategories(): Promise<string[]> {
  if (!isSupabaseReady()) {
    console.warn('Supabase not configured, returning default categories')
    return DEFAULT_CATEGORIES
  }

  // Check cache first
  const cached = getCached<string[]>('categories')
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('category')
      .eq('status', 'Published')

    if (error) {
      console.error('Error fetching categories:', error)
      return DEFAULT_CATEGORIES
    }

    if (!data || data.length === 0) {
      return DEFAULT_CATEGORIES
    }

    // Get unique categories and count occurrences
    const categoryCounts = new Map<string, number>()
    data.forEach((prompt) => {
      if (prompt.category) {
        categoryCounts.set(
          prompt.category,
          (categoryCounts.get(prompt.category) || 0) + 1
        )
      }
    })

    // Sort by count (descending), then alphabetically
    const sortedCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1] // Sort by count descending
        }
        return a[0].localeCompare(b[0]) // Then alphabetically
      })
      .map(([category]) => category)

    // Cache the result
    setCache('categories', sortedCategories)

    return sortedCategories.length > 0 ? sortedCategories : DEFAULT_CATEGORIES
  } catch (err) {
    console.error('Error fetching categories:', err)
    return DEFAULT_CATEGORIES
  }
}

/**
 * Fetch categories with usage counts for analytics
 */
export async function fetchCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  if (!isSupabaseReady()) {
    return DEFAULT_CATEGORIES.map((cat) => ({ category: cat, count: 0 }))
  }

  // Check cache first
  const cached = getCached<CategoryWithCount[]>('categories-with-counts')
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('category')
      .eq('status', 'Published')

    if (error) {
      console.error('Error fetching category stats:', error)
      return DEFAULT_CATEGORIES.map((cat) => ({ category: cat, count: 0 }))
    }

    if (!data || data.length === 0) {
      return DEFAULT_CATEGORIES.map((cat) => ({ category: cat, count: 0 }))
    }

    // Count occurrences
    const categoryCounts = new Map<string, number>()
    data.forEach((prompt) => {
      if (prompt.category) {
        categoryCounts.set(
          prompt.category,
          (categoryCounts.get(prompt.category) || 0) + 1
        )
      }
    })

    // Convert to array and sort
    const result = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return a.category.localeCompare(b.category)
      })

    // Cache the result
    setCache('categories-with-counts', result)

    return result
  } catch (err) {
    console.error('Error fetching category stats:', err)
    return DEFAULT_CATEGORIES.map((cat) => ({ category: cat, count: 0 }))
  }
}

/**
 * Fetch popular tags from published prompts
 * @param limit - Maximum number of tags to return (default: 50)
 */
export async function fetchPopularTags(limit: number = 50): Promise<TagWithCount[]> {
  if (!isSupabaseReady()) {
    return []
  }

  // Check cache first
  const cacheKey = `popular-tags-${limit}`
  const cached = getCached<TagWithCount[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('tags')
      .eq('status', 'Published')
      .not('tags', 'is', null)

    if (error) {
      console.error('Error fetching tags:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Flatten and count tags
    const tagCounts = new Map<string, number>()
    data.forEach((prompt) => {
      if (prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0) {
        prompt.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            const normalizedTag = tag.trim().toLowerCase()
            tagCounts.set(
              normalizedTag,
              (tagCounts.get(normalizedTag) || 0) + 1
            )
          }
        })
      }
    })

    // Convert to array, sort, and limit
    const result = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return a.tag.localeCompare(b.tag)
      })
      .slice(0, limit)

    // Cache the result
    setCache(cacheKey, result)

    return result
  } catch (err) {
    console.error('Error fetching tags:', err)
    return []
  }
}

/**
 * Get all unique tags (without counts) for autocomplete/suggestions
 */
export async function fetchAllTags(): Promise<string[]> {
  const tagsWithCounts = await fetchPopularTags(1000)
  return tagsWithCounts.map((item) => item.tag)
}

/**
 * Get category statistics for analytics
 */
export async function getCategoryStats(): Promise<{
  totalCategories: number
  totalPrompts: number
  categories: CategoryWithCount[]
}> {
  const categories = await fetchCategoriesWithCounts()
  const totalPrompts = categories.reduce((sum, cat) => sum + cat.count, 0)

  return {
    totalCategories: categories.length,
    totalPrompts,
    categories,
  }
}

/**
 * Get tag statistics for analytics
 */
export async function getTagStats(): Promise<{
  totalTags: number
  totalTagUsages: number
  tags: TagWithCount[]
}> {
  const tags = await fetchPopularTags(1000)
  const totalTagUsages = tags.reduce((sum, tag) => sum + tag.count, 0)

  return {
    totalTags: tags.length,
    totalTagUsages,
    tags,
  }
}

