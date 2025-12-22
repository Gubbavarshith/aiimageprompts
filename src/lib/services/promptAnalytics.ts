import { supabase } from '@/lib/supabaseClient'
import { isSupabaseReady } from '@/lib/supabaseClient'

export type PromptAnalyticsData = {
  date: string
  label: string
  total: number
  userSubmitted: number
  adminCreated: number
}

export type MonthlyPromptStats = {
  month: string
  monthLabel: string
  total: number
  userSubmitted: number
  adminCreated: number
}

export type PromptAnalyticsSummary = {
  totalPrompts: number
  userSubmittedCount: number
  adminCreatedCount: number
  thisMonthCount: number
  lastMonthCount: number
  thisWeekCount: number
  lastWeekCount: number
  userSubmittedPercentage: number
  adminCreatedPercentage: number
}

/**
 * Fetch prompt analytics summary with overall stats
 */
export async function fetchPromptAnalyticsSummary(): Promise<PromptAnalyticsSummary> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)
  
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfThisWeek)
  endOfLastWeek.setMilliseconds(endOfLastWeek.getMilliseconds() - 1)

  // Fetch all prompts
  const { data: allPrompts, error } = await supabase
    .from('prompts')
    .select('created_at, user_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompt analytics:', error)
    throw error
  }

  if (!allPrompts || allPrompts.length === 0) {
    return {
      totalPrompts: 0,
      userSubmittedCount: 0,
      adminCreatedCount: 0,
      thisMonthCount: 0,
      lastMonthCount: 0,
      thisWeekCount: 0,
      lastWeekCount: 0,
      userSubmittedPercentage: 0,
      adminCreatedPercentage: 0,
    }
  }

  const totalPrompts = allPrompts.length
  const userSubmittedCount = allPrompts.filter(p => p.user_id !== null).length
  const adminCreatedCount = allPrompts.filter(p => p.user_id === null).length

  const thisMonthCount = allPrompts.filter(p => {
    const created = new Date(p.created_at)
    return created >= startOfThisMonth
  }).length

  const lastMonthCount = allPrompts.filter(p => {
    const created = new Date(p.created_at)
    return created >= startOfLastMonth && created <= endOfLastMonth
  }).length

  const thisWeekCount = allPrompts.filter(p => {
    const created = new Date(p.created_at)
    return created >= startOfThisWeek
  }).length

  const lastWeekCount = allPrompts.filter(p => {
    const created = new Date(p.created_at)
    return created >= startOfLastWeek && created <= endOfLastWeek
  }).length

  return {
    totalPrompts,
    userSubmittedCount,
    adminCreatedCount,
    thisMonthCount,
    lastMonthCount,
    thisWeekCount,
    lastWeekCount,
    userSubmittedPercentage: totalPrompts > 0 ? (userSubmittedCount / totalPrompts) * 100 : 0,
    adminCreatedPercentage: totalPrompts > 0 ? (adminCreatedCount / totalPrompts) * 100 : 0,
  }
}

export type ChartPeriod = 
  | '7days' 
  | '30days' 
  | '3months' 
  | '6months' 
  | 'year' 
  | { startDate: string; endDate: string }

/**
 * Fetch prompt creation data for chart visualization
 * Returns data grouped by day for short periods, by month for longer periods
 */
export async function fetchPromptCreationChartData(
  period: ChartPeriod
): Promise<PromptAnalyticsData[]> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  // Determine date range
  let startDate: Date
  let endDate: Date = new Date()
  endDate.setHours(23, 59, 59, 999)

  if (typeof period === 'object') {
    // Custom date range
    startDate = new Date(period.startDate)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(period.endDate)
    endDate.setHours(23, 59, 59, 999)
  } else {
    startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    
    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 6) // Include today
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 29) // Include today
        break
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3)
        startDate.setDate(1) // Start of first month
        break
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6)
        startDate.setDate(1) // Start of first month
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setMonth(0, 1) // January 1st
        break
    }
  }

  // Fetch prompts within date range
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('created_at, user_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching prompt chart data:', error)
    throw error
  }

  // Determine if we should group by day or month
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const groupByMonth = daysDiff > 90 // Group by month if more than 90 days

  if (!prompts || prompts.length === 0) {
    // Return empty data structure for the requested period
    const buckets: PromptAnalyticsData[] = []
    
    if (groupByMonth) {
      // Create monthly buckets
      const current = new Date(startDate)
      while (current <= endDate) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        const label = current.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        
        buckets.push({
          date: monthKey,
          label,
          total: 0,
          userSubmitted: 0,
          adminCreated: 0,
        })
        
        current.setMonth(current.getMonth() + 1)
      }
    } else {
      // Create daily buckets
      const current = new Date(startDate)
      while (current <= endDate) {
        const key = current.toISOString().split('T')[0]
        const label =
          daysDiff <= 7
            ? current.toLocaleDateString(undefined, { weekday: 'short' })
            : current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        
        buckets.push({
          date: key,
          label,
          total: 0,
          userSubmitted: 0,
          adminCreated: 0,
        })
        
        current.setDate(current.getDate() + 1)
      }
    }
    
    return buckets
  }

  // Create buckets
  const buckets: Map<string, PromptAnalyticsData> = new Map()

  if (groupByMonth) {
    // Create monthly buckets
    const current = new Date(startDate)
    while (current <= endDate) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      const label = current.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      
      buckets.set(monthKey, {
        date: monthKey,
        label,
        total: 0,
        userSubmitted: 0,
        adminCreated: 0,
      })
      
      current.setMonth(current.getMonth() + 1)
    }
  } else {
    // Create daily buckets
    const current = new Date(startDate)
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0]
      const label =
        daysDiff <= 7
          ? current.toLocaleDateString(undefined, { weekday: 'short' })
          : current.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      
      buckets.set(key, {
        date: key,
        label,
        total: 0,
        userSubmitted: 0,
        adminCreated: 0,
      })
      
      current.setDate(current.getDate() + 1)
    }
  }

  // Count prompts
  prompts.forEach(prompt => {
    const created = new Date(prompt.created_at)
    let key: string

    if (groupByMonth) {
      key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    } else {
      created.setHours(0, 0, 0, 0)
      key = created.toISOString().split('T')[0]
    }

    const bucket = buckets.get(key)
    if (bucket) {
      bucket.total++
      if (prompt.user_id !== null) {
        bucket.userSubmitted++
      } else {
        bucket.adminCreated++
      }
    }
  })

  return Array.from(buckets.values())
}

/**
 * Fetch monthly prompt statistics for the last 12 months
 */
export async function fetchMonthlyPromptStats(): Promise<MonthlyPromptStats[]> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('created_at, user_id')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching monthly prompt stats:', error)
    throw error
  }

  if (!prompts || prompts.length === 0) {
    return []
  }

  // Group by month
  const monthlyMap = new Map<string, MonthlyPromptStats>()

  prompts.forEach(prompt => {
    const created = new Date(prompt.created_at)
    const monthKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    const monthLabel = created.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        monthLabel,
        total: 0,
        userSubmitted: 0,
        adminCreated: 0,
      })
    }

    const stats = monthlyMap.get(monthKey)!
    stats.total++
    if (prompt.user_id !== null) {
      stats.userSubmitted++
    } else {
      stats.adminCreated++
    }
  })

  return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}

