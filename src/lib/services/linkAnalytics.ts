import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

export type LinkAnalyticsRecord = {
  id: string
  link_id: string
  timestamp: string
  referrer: string | null
  device_type: 'desktop' | 'mobile' | 'tablet'
  operating_system: string | null
  browser: string | null
  country: string | null
  visitor_id: string | null
}

export type AnalyticsSummary = {
  total_clicks: number
  unique_clicks: number
  device_breakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  top_referrers: Array<{ referrer: string; count: number }>
  top_countries: Array<{ country: string; count: number }>
}

export type DailyClickData = {
  date: string
  clicks: number
  unique_clicks: number
}

/**
 * Get analytics summary for a specific link
 */
export async function getAnalyticsSummary(linkId: string, dateRange?: { start: string; end: string }): Promise<AnalyticsSummary> {
  if (!isSupabaseReady()) {
    return {
      total_clicks: 0,
      unique_clicks: 0,
      device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
      top_referrers: [],
      top_countries: [],
    }
  }

  try {
    let query = supabase
      .from('link_analytics')
      .select('*')
      .eq('link_id', linkId)

    if (dateRange) {
      query = query
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        total_clicks: 0,
        unique_clicks: 0,
        device_breakdown: { desktop: 0, mobile: 0, tablet: 0 },
        top_referrers: [],
        top_countries: [],
      }
    }

    // Calculate unique clicks
    const uniqueVisitors = new Set(data.filter(d => d.visitor_id).map(d => d.visitor_id))

    // Device breakdown
    const deviceBreakdown = {
      desktop: data.filter(d => d.device_type === 'desktop').length,
      mobile: data.filter(d => d.device_type === 'mobile').length,
      tablet: data.filter(d => d.device_type === 'tablet').length,
    }

    // Top referrers
    const referrerCounts = new Map<string, number>()
    data.forEach(click => {
      const ref = click.referrer || 'direct'
      referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1)
    })
    const topReferrers = Array.from(referrerCounts.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top countries
    const countryCounts = new Map<string, number>()
    data.forEach(click => {
      if (click.country) {
        countryCounts.set(click.country, (countryCounts.get(click.country) || 0) + 1)
      }
    })
    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total_clicks: data.length,
      unique_clicks: uniqueVisitors.size,
      device_breakdown,
      top_referrers: topReferrers,
      top_countries: topCountries,
    }
  } catch (err) {
    console.error('Error fetching analytics summary:', err)
    throw new Error(`Failed to fetch analytics summary: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

/**
 * Get daily click counts for a link (for charts)
 */
export async function getDailyClicks(linkId: string, days: number = 30): Promise<DailyClickData[]> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    const { data, error } = await supabase
      .from('link_analytics')
      .select('timestamp, visitor_id')
      .eq('link_id', linkId)
      .gte('timestamp', startDateStr)
      .order('timestamp', { ascending: true })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by date
    const dailyMap = new Map<string, { total: number; unique: Set<string> }>()

    data.forEach(click => {
      const date = new Date(click.timestamp).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { total: 0, unique: new Set() })
      }
      const dayData = dailyMap.get(date)!
      dayData.total++
      if (click.visitor_id) {
        dayData.unique.add(click.visitor_id)
      }
    })

    // Convert to array and fill missing dates with zeros
    const result: DailyClickData[] = []
    const today = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = dailyMap.get(dateStr) || { total: 0, unique: new Set() }
      result.push({
        date: dateStr,
        clicks: dayData.total,
        unique_clicks: dayData.unique.size,
      })
    }

    return result
  } catch (err) {
    console.error('Error fetching daily clicks:', err)
    throw new Error(`Failed to fetch daily clicks: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

/**
 * Get traffic sources breakdown
 */
export async function getTrafficSources(linkId: string): Promise<Array<{ source: string; count: number }>> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('link_analytics')
      .select('referrer')
      .eq('link_id', linkId)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    const sourceCounts = new Map<string, number>()
    data.forEach(click => {
      const source = click.referrer || 'direct'
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
    })

    return Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  } catch (err) {
    console.error('Error fetching traffic sources:', err)
    return []
  }
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown(linkId: string): Promise<Array<{ device: string; count: number }>> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('link_analytics')
      .select('device_type')
      .eq('link_id', linkId)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    const deviceCounts = new Map<string, number>()
    data.forEach(click => {
      const device = click.device_type
      deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1)
    })

    return Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
  } catch (err) {
    console.error('Error fetching device breakdown:', err)
    return []
  }
}

/**
 * Get country breakdown
 */
export async function getCountryBreakdown(linkId: string): Promise<Array<{ country: string; count: number }>> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('link_analytics')
      .select('country')
      .eq('link_id', linkId)
      .not('country', 'is', null)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    const countryCounts = new Map<string, number>()
    data.forEach(click => {
      if (click.country) {
        countryCounts.set(click.country, (countryCounts.get(click.country) || 0) + 1)
      }
    })

    return Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Top 20 countries
  } catch (err) {
    console.error('Error fetching country breakdown:', err)
    return []
  }
}

/**
 * Get recent clicks for a link
 */
export async function getRecentClicks(linkId: string, limit: number = 50): Promise<LinkAnalyticsRecord[]> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('link_analytics')
      .select('*')
      .eq('link_id', linkId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []) as LinkAnalyticsRecord[]
  } catch (err) {
    console.error('Error fetching recent clicks:', err)
    return []
  }
}

/**
 * Get global analytics (all links)
 */
export async function getGlobalAnalytics(dateRange?: { start: string; end: string }): Promise<{
  total_clicks: number
  top_links: Array<{ link_id: string; title: string; clicks: number }>
  inactive_links: Array<{ link_id: string; title: string; last_click: string | null }>
}> {
  if (!isSupabaseReady()) {
    return {
      total_clicks: 0,
      top_links: [],
      inactive_links: [],
    }
  }

  try {
    let analyticsQuery = supabase
      .from('link_analytics')
      .select('link_id')

    if (dateRange) {
      analyticsQuery = analyticsQuery
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
    }

    const { data: analytics, error: analyticsError } = await analyticsQuery

    if (analyticsError) {
      throw analyticsError
    }

    // Get all links
    const { data: links, error: linksError } = await supabase
      .from('tracked_links')
      .select('id, campaign_name, unique_id')

    if (linksError) {
      throw linksError
    }

    // Count clicks per link
    const linkClickCounts = new Map<string, number>()
    analytics?.forEach(click => {
      if (click.link_id) {
        linkClickCounts.set(click.link_id, (linkClickCounts.get(click.link_id) || 0) + 1)
      }
    })

    // Top links
    const topLinks = Array.from(linkClickCounts.entries())
      .map(([linkId, clicks]) => {
        const link = links?.find(l => l.id === linkId)
        return {
          link_id: linkId,
          title: link?.campaign_name || 'Unknown',
          clicks,
        }
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)

    // Inactive links (no clicks in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: recentClicks } = await supabase
      .from('link_analytics')
      .select('link_id, timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString())

    const activeLinkIds = new Set(recentClicks?.map(c => c.link_id) || [])
    const inactiveLinks = (links || [])
      .filter(link => !activeLinkIds.has(link.id))
      .map(link => ({
        link_id: link.id,
        title: link.campaign_name,
        last_click: null as string | null,
      }))

    return {
      total_clicks: analytics?.length || 0,
      top_links: topLinks,
      inactive_links: inactiveLinks,
    }
  } catch (err) {
    console.error('Error fetching global analytics:', err)
    return {
      total_clicks: 0,
      top_links: [],
      inactive_links: [],
    }
  }
}

