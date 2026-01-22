/**
 * Google Analytics Service
 * Frontend service layer for invoking the Google Analytics Edge Function
 * All GA data is fetched server-side via Supabase Edge Functions
 */

import { supabase, isSupabaseReady } from '../supabaseClient'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/** Overview metrics response from GA4 */
export interface GAOverviewResponse {
  totalUsers: number
  sessions: number
  screenPageViews: number
  bounceRate: number
}

/** Traffic source entry from GA4 */
export interface GATrafficSource {
  source: string
  medium: string
  sessions: number
}

/** Top page entry from GA4 */
export interface GATopPage {
  pagePath: string
  views: number
}

/** Realtime response from GA4 */
export interface GARealtimeResponse {
  activeUsers: number
}

/** Error response from Edge Function */
export interface GAErrorResponse {
  error: string
  details?: string
}

/** Date range parameters for queries */
export interface GADateRange {
  startDate?: string
  endDate?: string
}

/** Combined analytics data for the dashboard */
export interface GADashboardData {
  overview: GAOverviewResponse | null
  trafficSources: GATrafficSource[]
  topPages: GATopPage[]
  realtime: GARealtimeResponse | null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Invoke the Google Analytics Edge Function with authentication
 * Automatically includes the user's session token for admin validation
 */
async function invokeGAFunction<T>(
  endpoint: string,
  dateRange?: GADateRange
): Promise<T> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  // Get current session for authentication
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw new Error('Not authenticated. Please log in.')
  }

  // Invoke the Edge Function with auth token
  const { data, error } = await supabase.functions.invoke('google-analytics', {
    body: {
      endpoint,
      ...dateRange,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    console.error(`GA Edge Function error (${endpoint}):`, error)
    // Try to extract more detailed error message
    const errorMessage = error.message || 'Failed to fetch analytics data'
    throw new Error(errorMessage)
  }

  // Check for error response from the function
  if (data && typeof data === 'object' && 'error' in data) {
    const errorData = data as GAErrorResponse
    console.error(`GA API error (${endpoint}):`, errorData)
    throw new Error(errorData.details || errorData.error)
  }

  // Handle null/undefined data
  if (data === null || data === undefined) {
    throw new Error('No data returned from analytics service')
  }

  return data as T
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Fetch overview metrics (users, sessions, page views, bounce rate)
 * @param dateRange Optional date range, defaults to last 30 days
 */
export async function fetchGAOverview(dateRange?: GADateRange): Promise<GAOverviewResponse> {
  return invokeGAFunction<GAOverviewResponse>('overview', dateRange)
}

/**
 * Fetch traffic sources breakdown (source, medium, sessions)
 * @param dateRange Optional date range, defaults to last 30 days
 */
export async function fetchGATrafficSources(dateRange?: GADateRange): Promise<GATrafficSource[]> {
  return invokeGAFunction<GATrafficSource[]>('traffic-sources', dateRange)
}

/**
 * Fetch top pages by views
 * @param dateRange Optional date range, defaults to last 30 days
 */
export async function fetchGATopPages(dateRange?: GADateRange): Promise<GATopPage[]> {
  return invokeGAFunction<GATopPage[]>('top-pages', dateRange)
}

/**
 * Fetch realtime active users count
 * Note: This endpoint ignores date range parameters
 */
export async function fetchGARealtime(): Promise<GARealtimeResponse> {
  return invokeGAFunction<GARealtimeResponse>('realtime')
}

/**
 * Fetch all analytics data in parallel
 * Useful for initial dashboard load
 * @param dateRange Optional date range for historical data
 */
export async function fetchAllGAData(dateRange?: GADateRange): Promise<GADashboardData> {
  const [overview, trafficSources, topPages, realtime] = await Promise.allSettled([
    fetchGAOverview(dateRange),
    fetchGATrafficSources(dateRange),
    fetchGATopPages(dateRange),
    fetchGARealtime(),
  ])

  return {
    overview: overview.status === 'fulfilled' ? overview.value : null,
    trafficSources: trafficSources.status === 'fulfilled' ? trafficSources.value : [],
    topPages: topPages.status === 'fulfilled' ? topPages.value : [],
    realtime: realtime.status === 'fulfilled' ? realtime.value : null,
  }
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Get date range for last N days
 */
export function getDateRangeForDays(days: number): GADateRange {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { startDate, endDate }
}

/**
 * Predefined date range options
 */
export const DATE_RANGE_OPTIONS = {
  '7days': { label: '7 Days', days: 7 },
  '30days': { label: '30 Days', days: 30 },
  '90days': { label: '90 Days', days: 90 },
} as const

export type DateRangeOption = keyof typeof DATE_RANGE_OPTIONS

