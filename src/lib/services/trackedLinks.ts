import { supabase, isSupabaseReady } from '../supabaseClient'

// =============================================================================
// Types
// =============================================================================

export interface TrackedLink {
  id: string
  slug: string
  destination: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  title?: string | null
  description?: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface LinkClick {
  id: number
  link_id: string
  clicked_at: string
  ip?: string | null
  user_agent?: string | null
  referrer?: string | null
  country?: string | null
  device_type?: string | null
}

export interface LinkAnalytics {
  totalClicks: number
  uniqueClicks: number
  clicksByDate: Array<{ date: string; count: number }>
  clicksByCountry: Array<{ country: string; count: number }>
  clicksByDevice: Array<{ device: string; count: number }>
  clicksByReferrer: Array<{ referrer: string; count: number }>
}

export interface CreateTrackedLinkInput {
  destination: string
  slug?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  title?: string
  description?: string
}

export interface UpdateTrackedLinkInput {
  destination?: string
  slug?: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  title?: string | null
  description?: string | null
  is_active?: boolean
}

export interface TrackedLinkFilters {
  search?: string
  campaign?: string
  isActive?: boolean
  startDate?: string
  endDate?: string
}

export interface TrackedLinkWithStats extends TrackedLink {
  click_count: number
  last_clicked_at: string | null
}

// =============================================================================
// Slug Generation
// =============================================================================

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_SLUG_LENGTH = 7

/**
 * Generate a random URL-safe slug
 */
function generateRandomSlug(length: number = DEFAULT_SLUG_LENGTH): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += SLUG_CHARS.charAt(Math.floor(Math.random() * SLUG_CHARS.length))
  }
  return result
}

/**
 * Sanitize a custom slug to be URL-safe
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Check if a slug is already taken
 */
export async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  let query = supabase
    .from('tracked_links')
    .select('id')
    .eq('slug', slug)
  
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  
  const { data, error } = await query.maybeSingle()
  
  if (error) {
    console.error('Error checking slug:', error)
    throw error
  }
  
  return !!data
}

/**
 * Generate a unique slug, optionally based on a custom slug
 */
export async function generateUniqueSlug(customSlug?: string): Promise<string> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  let slug = customSlug ? sanitizeSlug(customSlug) : generateRandomSlug()
  let attempts = 0
  const maxAttempts = 10
  
  while (await isSlugTaken(slug) && attempts < maxAttempts) {
    if (customSlug) {
      // Append random suffix to custom slug
      slug = `${sanitizeSlug(customSlug)}-${generateRandomSlug(4)}`
    } else {
      // Generate new random slug
      slug = generateRandomSlug()
    }
    attempts++
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique slug. Please try a different custom slug.')
  }
  
  return slug
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a new tracked link
 */
export async function createTrackedLink(input: CreateTrackedLinkInput): Promise<TrackedLink> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Not authenticated')
  }
  
  // Generate unique slug
  const slug = await generateUniqueSlug(input.slug)
  
  // Validate destination URL
  try {
    new URL(input.destination)
  } catch {
    throw new Error('Invalid destination URL')
  }
  
  const { data, error } = await supabase
    .from('tracked_links')
    .insert({
      slug,
      destination: input.destination,
      utm_source: input.utm_source || null,
      utm_medium: input.utm_medium || null,
      utm_campaign: input.utm_campaign || null,
      utm_content: input.utm_content || null,
      title: input.title || null,
      description: input.description || null,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating tracked link:', error)
    throw error
  }
  
  return data as TrackedLink
}

/**
 * Update an existing tracked link
 */
export async function updateTrackedLink(id: string, input: UpdateTrackedLinkInput): Promise<TrackedLink> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // If updating slug, ensure it's unique
  if (input.slug) {
    const sanitizedSlug = sanitizeSlug(input.slug)
    const isTaken = await isSlugTaken(sanitizedSlug, id)
    if (isTaken) {
      throw new Error('Slug is already taken')
    }
    input.slug = sanitizedSlug
  }
  
  // Validate destination URL if provided
  if (input.destination) {
    try {
      new URL(input.destination)
    } catch {
      throw new Error('Invalid destination URL')
    }
  }
  
  const { data, error } = await supabase
    .from('tracked_links')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating tracked link:', error)
    throw error
  }
  
  return data as TrackedLink
}

/**
 * Delete a tracked link
 */
export async function deleteTrackedLink(id: string): Promise<void> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from('tracked_links')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting tracked link:', error)
    throw error
  }
}

/**
 * Delete multiple tracked links
 */
export async function deleteTrackedLinks(ids: string[]): Promise<void> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const { error } = await supabase
    .from('tracked_links')
    .delete()
    .in('id', ids)
  
  if (error) {
    console.error('Error deleting tracked links:', error)
    throw error
  }
}

/**
 * Get a single tracked link by ID
 */
export async function getTrackedLink(id: string): Promise<TrackedLink | null> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from('tracked_links')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching tracked link:', error)
    throw error
  }
  
  return data as TrackedLink
}

/**
 * Get all tracked links with optional filters and click stats
 */
export async function getTrackedLinks(filters?: TrackedLinkFilters): Promise<TrackedLinkWithStats[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // Build the query with click count aggregation
  let query = supabase
    .from('tracked_links')
    .select(`
      *,
      link_clicks(count)
    `)
    .order('created_at', { ascending: false })
  
  // Apply filters
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`)
  }
  
  if (filters?.campaign) {
    query = query.eq('utm_campaign', filters.campaign)
  }
  
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching tracked links:', error)
    throw error
  }
  
  // Get last clicked dates for each link
  const linkIds = data.map((link: { id: string }) => link.id)
  const { data: lastClicks } = await supabase
    .from('link_clicks')
    .select('link_id, clicked_at')
    .in('link_id', linkIds)
    .order('clicked_at', { ascending: false })
  
  // Build a map of last clicked dates
  const lastClickMap = new Map<string, string>()
  if (lastClicks) {
    for (const click of lastClicks) {
      if (!lastClickMap.has(click.link_id)) {
        lastClickMap.set(click.link_id, click.clicked_at)
      }
    }
  }
  
  // Transform data to include click stats
  return data.map((link: TrackedLink & { link_clicks: Array<{ count: number }> }) => ({
    ...link,
    click_count: link.link_clicks?.[0]?.count || 0,
    last_clicked_at: lastClickMap.get(link.id) || null,
    link_clicks: undefined, // Remove the raw link_clicks array
  })) as TrackedLinkWithStats[]
}

// =============================================================================
// Analytics
// =============================================================================

/**
 * Get analytics for a specific link
 */
export async function getLinkAnalytics(
  linkId: string,
  startDate?: string,
  endDate?: string
): Promise<LinkAnalytics> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  let query = supabase
    .from('link_clicks')
    .select('*')
    .eq('link_id', linkId)
    .order('clicked_at', { ascending: true })
  
  if (startDate) {
    query = query.gte('clicked_at', startDate)
  }
  
  if (endDate) {
    query = query.lte('clicked_at', endDate)
  }
  
  const { data: clicks, error } = await query
  
  if (error) {
    console.error('Error fetching link analytics:', error)
    throw error
  }
  
  const allClicks = clicks as LinkClick[]
  
  // Calculate totals
  const totalClicks = allClicks.length
  const uniqueIps = new Set(allClicks.filter(c => c.ip).map(c => c.ip))
  const uniqueClicks = uniqueIps.size || totalClicks
  
  // Group by date
  const clicksByDateMap = new Map<string, number>()
  for (const click of allClicks) {
    const date = click.clicked_at.split('T')[0]
    clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1)
  }
  const clicksByDate = Array.from(clicksByDateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // Group by country
  const clicksByCountryMap = new Map<string, number>()
  for (const click of allClicks) {
    const country = click.country || 'Unknown'
    clicksByCountryMap.set(country, (clicksByCountryMap.get(country) || 0) + 1)
  }
  const clicksByCountry = Array.from(clicksByCountryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
  
  // Group by device
  const clicksByDeviceMap = new Map<string, number>()
  for (const click of allClicks) {
    const device = click.device_type || 'Unknown'
    clicksByDeviceMap.set(device, (clicksByDeviceMap.get(device) || 0) + 1)
  }
  const clicksByDevice = Array.from(clicksByDeviceMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count)
  
  // Group by referrer
  const clicksByReferrerMap = new Map<string, number>()
  for (const click of allClicks) {
    let referrer = 'Direct'
    if (click.referrer) {
      try {
        const url = new URL(click.referrer)
        referrer = url.hostname
      } catch {
        referrer = click.referrer
      }
    }
    clicksByReferrerMap.set(referrer, (clicksByReferrerMap.get(referrer) || 0) + 1)
  }
  const clicksByReferrer = Array.from(clicksByReferrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
  
  return {
    totalClicks,
    uniqueClicks,
    clicksByDate,
    clicksByCountry,
    clicksByDevice,
    clicksByReferrer,
  }
}

/**
 * Get aggregate analytics for all links
 */
export async function getOverallLinkAnalytics(
  startDate?: string,
  endDate?: string
): Promise<{
  totalLinks: number
  activeLinks: number
  totalClicks: number
  topLinks: Array<{ link: TrackedLink; clicks: number }>
}> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // Get all links
  const { data: links, error: linksError } = await supabase
    .from('tracked_links')
    .select('*')
  
  if (linksError) {
    console.error('Error fetching links for analytics:', linksError)
    throw linksError
  }
  
  // Get click counts
  let clicksQuery = supabase
    .from('link_clicks')
    .select('link_id')
  
  if (startDate) {
    clicksQuery = clicksQuery.gte('clicked_at', startDate)
  }
  
  if (endDate) {
    clicksQuery = clicksQuery.lte('clicked_at', endDate)
  }
  
  const { data: clicks, error: clicksError } = await clicksQuery
  
  if (clicksError) {
    console.error('Error fetching clicks for analytics:', clicksError)
    throw clicksError
  }
  
  // Count clicks per link
  const clickCountMap = new Map<string, number>()
  for (const click of clicks || []) {
    clickCountMap.set(click.link_id, (clickCountMap.get(click.link_id) || 0) + 1)
  }
  
  // Calculate stats
  const totalLinks = links?.length || 0
  const activeLinks = links?.filter((l: TrackedLink) => l.is_active).length || 0
  const totalClicks = clicks?.length || 0
  
  // Get top links by clicks
  const linksWithClicks = (links || []).map((link: TrackedLink) => ({
    link,
    clicks: clickCountMap.get(link.id) || 0,
  }))
  
  const topLinks = linksWithClicks
    .sort((a: { clicks: number }, b: { clicks: number }) => b.clicks - a.clicks)
    .slice(0, 10)
  
  return {
    totalLinks,
    activeLinks,
    totalClicks,
    topLinks,
  }
}

/**
 * Get unique campaigns from all tracked links
 */
export async function getUniqueCampaigns(): Promise<string[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase
    .from('tracked_links')
    .select('utm_campaign')
    .not('utm_campaign', 'is', null)
  
  if (error) {
    console.error('Error fetching campaigns:', error)
    throw error
  }
  
  const campaigns = [...new Set(data.map((d: { utm_campaign: string }) => d.utm_campaign))]
  return campaigns.filter(Boolean).sort()
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Build a tracking URL from a slug
 */
export function buildTrackingUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || import.meta.env.VITE_SITE_URL || window.location.origin
  return `${base}/l/${slug}`
}

/**
 * Toggle link active status
 */
export async function toggleLinkActive(id: string, isActive: boolean): Promise<TrackedLink> {
  return updateTrackedLink(id, { is_active: isActive })
}

