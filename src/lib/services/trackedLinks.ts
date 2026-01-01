import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import { customAlphabet } from 'nanoid'

// Generate short unique IDs (7-8 characters, URL-safe)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8)

export type TrackedLink = {
  id: string
  unique_id: string
  destination_url: string
  campaign_name: string
  platform: string
  notes: string | null
  status: 'active' | 'paused'
  created_at: string
  updated_at: string
}

export type TrackedLinkPayload = {
  destination_url: string
  campaign_name: string
  platform: string
  notes?: string | null
  status?: 'active' | 'paused'
}

export type TrackedLinkWithStats = TrackedLink & {
  total_clicks: number
  unique_clicks: number
}

/**
 * Create a new tracked link
 */
export async function createTrackedLink(payload: TrackedLinkPayload): Promise<TrackedLink> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  // Generate unique ID
  let uniqueId = nanoid()
  let attempts = 0
  const maxAttempts = 10

  // Ensure uniqueness (retry if collision)
  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('tracked_links')
      .select('id')
      .eq('unique_id', uniqueId)
      .single()

    if (!existing) {
      break // Unique ID found
    }

    uniqueId = nanoid()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique ID after multiple attempts')
  }

  const { data, error } = await supabase
    .from('tracked_links')
    .insert({
      unique_id: uniqueId,
      destination_url: payload.destination_url,
      campaign_name: payload.campaign_name,
      platform: payload.platform,
      notes: payload.notes || null,
      status: payload.status || 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create tracked link: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to create tracked link: No data returned')
  }

  return data as TrackedLink
}

/**
 * Get all tracked links with aggregated click statistics
 */
export async function getTrackedLinks(): Promise<TrackedLinkWithStats[]> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    // Fetch all links
    const { data: links, error: linksError } = await supabase
      .from('tracked_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (linksError) {
      throw linksError
    }

    if (!links || links.length === 0) {
      return []
    }

    // Fetch aggregated analytics for all links
    const linkIds = links.map(link => link.id)
    const { data: analytics, error: analyticsError } = await supabase
      .from('link_analytics')
      .select('link_id, visitor_id')
      .in('link_id', linkIds)

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError)
      // Return links without stats if analytics query fails
      return links.map(link => ({
        ...link,
        total_clicks: 0,
        unique_clicks: 0,
      })) as TrackedLinkWithStats[]
    }

    // Calculate stats per link
    const statsMap = new Map<string, { total: number; unique: Set<string> }>()
    
    analytics?.forEach(click => {
      if (!click.link_id) return
      
      if (!statsMap.has(click.link_id)) {
        statsMap.set(click.link_id, { total: 0, unique: new Set() })
      }
      
      const stats = statsMap.get(click.link_id)!
      stats.total++
      if (click.visitor_id) {
        stats.unique.add(click.visitor_id)
      }
    })

    // Combine links with stats
    return links.map(link => {
      const stats = statsMap.get(link.id) || { total: 0, unique: new Set() }
      return {
        ...link,
        total_clicks: stats.total,
        unique_clicks: stats.unique.size,
      } as TrackedLinkWithStats
    })
  } catch (err) {
    console.error('Error fetching tracked links:', err)
    throw new Error(`Failed to fetch tracked links: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

/**
 * Get a single tracked link by ID
 */
export async function getTrackedLinkById(id: string): Promise<TrackedLink | null> {
  if (!isSupabaseReady()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data as TrackedLink
  } catch (err) {
    console.error('Error fetching tracked link:', err)
    throw new Error(`Failed to fetch tracked link: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

/**
 * Get a tracked link by unique_id (for redirect handler)
 */
export async function getTrackedLinkByUniqueId(uniqueId: string): Promise<TrackedLink | null> {
  if (!isSupabaseReady()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('unique_id', uniqueId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data as TrackedLink
  } catch (err) {
    console.error('Error fetching tracked link by unique_id:', err)
    return null
  }
}

/**
 * Update a tracked link
 */
export async function updateTrackedLink(id: string, payload: Partial<TrackedLinkPayload>): Promise<TrackedLink> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const updateData: any = {}
  if (payload.destination_url !== undefined) updateData.destination_url = payload.destination_url
  if (payload.campaign_name !== undefined) updateData.campaign_name = payload.campaign_name
  if (payload.platform !== undefined) updateData.platform = payload.platform
  if (payload.notes !== undefined) updateData.notes = payload.notes
  if (payload.status !== undefined) updateData.status = payload.status

  const { data, error } = await supabase
    .from('tracked_links')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update tracked link: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to update tracked link: No data returned')
  }

  return data as TrackedLink
}

/**
 * Delete a tracked link and its analytics
 */
export async function deleteTrackedLink(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  // Cascade delete will handle analytics automatically
  const { error } = await supabase
    .from('tracked_links')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete tracked link: ${error.message}`)
  }
}

/**
 * Toggle link status (active/paused)
 */
export async function toggleLinkStatus(id: string, status: 'active' | 'paused'): Promise<TrackedLink> {
  return updateTrackedLink(id, { status })
}

