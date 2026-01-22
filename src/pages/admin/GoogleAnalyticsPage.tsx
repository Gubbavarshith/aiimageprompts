import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  GlobeAltIcon,
  SignalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  fetchGAOverview,
  fetchGATrafficSources,
  fetchGATopPages,
  fetchGARealtime,
  getDateRangeForDays,
  DATE_RANGE_OPTIONS,
  type GAOverviewResponse,
  type GATrafficSource,
  type GATopPage,
  type GARealtimeResponse,
  type DateRangeOption,
} from '@/lib/services/googleAnalytics'
import { isSupabaseReady } from '@/lib/supabaseClient'

// Animation variants for staggered entry
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function GoogleAnalyticsPage() {
  // State for analytics data
  const [overview, setOverview] = useState<GAOverviewResponse | null>(null)
  const [trafficSources, setTrafficSources] = useState<GATrafficSource[]>([])
  const [topPages, setTopPages] = useState<GATopPage[]>([])
  const [realtime, setRealtime] = useState<GARealtimeResponse | null>(null)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [isRealtimeLoading, setIsRealtimeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Date range selection
  const [dateRange, setDateRange] = useState<DateRangeOption>('30days')

  const supabaseReady = isSupabaseReady()

  // Fetch all analytics data except realtime
  const fetchAnalyticsData = useCallback(async () => {
    if (!supabaseReady) {
      setError('Supabase is not configured. Please check your environment variables.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const range = getDateRangeForDays(DATE_RANGE_OPTIONS[dateRange].days)

      const [overviewData, trafficData, pagesData] = await Promise.allSettled([
        fetchGAOverview(range),
        fetchGATrafficSources(range),
        fetchGATopPages(range),
      ])

      // Handle overview result
      if (overviewData.status === 'fulfilled') {
        setOverview(overviewData.value)
      } else {
        console.error('Failed to fetch overview:', overviewData.reason)
        setOverview(null)
      }

      // Handle traffic sources result
      if (trafficData.status === 'fulfilled') {
        setTrafficSources(trafficData.value)
      } else {
        console.error('Failed to fetch traffic sources:', trafficData.reason)
        setTrafficSources([])
      }

      // Handle top pages result
      if (pagesData.status === 'fulfilled') {
        setTopPages(pagesData.value)
      } else {
        console.error('Failed to fetch top pages:', pagesData.reason)
        setTopPages([])
      }

      // Check if all requests failed
      if (
        overviewData.status === 'rejected' &&
        trafficData.status === 'rejected' &&
        pagesData.status === 'rejected'
      ) {
        const errorMessage = overviewData.reason?.message || 'Failed to fetch analytics data'
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [supabaseReady, dateRange])

  // Fetch realtime data separately (for polling)
  const fetchRealtimeData = useCallback(async () => {
    if (!supabaseReady) return

    setIsRealtimeLoading(true)
    try {
      const data = await fetchGARealtime()
      setRealtime(data)
    } catch (err) {
      console.error('Error fetching realtime data:', err)
      // Don't show error for realtime - it's non-critical
    } finally {
      setIsRealtimeLoading(false)
    }
  }, [supabaseReady])

  // Initial data fetch
  useEffect(() => {
    document.title = 'Google Analytics | AI Image Prompts Admin'
    fetchAnalyticsData()
    fetchRealtimeData()
  }, [fetchAnalyticsData, fetchRealtimeData])

  // Poll realtime data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRealtimeData, 30000)
    return () => clearInterval(interval)
  }, [fetchRealtimeData])

  // Refresh all data
  const handleRefresh = () => {
    fetchAnalyticsData()
    fetchRealtimeData()
  }

  // Format bounce rate as percentage
  const formatBounceRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`
  }

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  // KPI card configuration
  const kpiCards = overview
    ? [
        {
          name: 'Total Users',
          value: formatNumber(overview.totalUsers),
          icon: UsersIcon,
          color: 'bg-blue-500/10 text-blue-500',
          description: 'Unique visitors',
        },
        {
          name: 'Sessions',
          value: formatNumber(overview.sessions),
          icon: CursorArrowRaysIcon,
          color: 'bg-purple-500/10 text-purple-500',
          description: 'Total sessions',
        },
        {
          name: 'Page Views',
          value: formatNumber(overview.screenPageViews),
          icon: DocumentTextIcon,
          color: 'bg-green-500/10 text-green-500',
          description: 'Total page views',
        },
        {
          name: 'Bounce Rate',
          value: formatBounceRate(overview.bounceRate),
          icon: ArrowTrendingDownIcon,
          color: 'bg-orange-500/10 text-orange-500',
          description: 'Single page visits',
        },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFDE1A]/10 border border-[#FFDE1A]/20">
              <ChartBarIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Google Analytics
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                Website traffic and performance metrics from GA4.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Realtime Indicator */}
          {realtime !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {isRealtimeLoading ? '...' : realtime.activeUsers}
              </span>
              <span className="text-xs text-green-600/80 dark:text-green-400/80">
                active now
              </span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </motion.div>
      </div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 w-fit"
      >
        {(Object.entries(DATE_RANGE_OPTIONS) as [DateRangeOption, { label: string; days: number }][]).map(
          ([key, { label }]) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                dateRange === key
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          )
        )}
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">
                Failed to Load Analytics
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-zinc-200 dark:border-zinc-700 border-t-[#FFDE1A] animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading analytics data...</p>
        </div>
      )}

      {/* KPI Cards */}
      {!isLoading && !error && overview && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.name}
              variants={itemVariants}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-none"
            >
              <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity transform rotate-12 group-hover:scale-110 duration-500">
                <card.icon className="w-32 h-32 text-zinc-900 dark:text-white" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.name}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tables Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <GlobeAltIcon className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Traffic Sources</h2>
            </div>

            {trafficSources.length === 0 ? (
              <div className="py-12 text-center">
                <GlobeAltIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No traffic source data available
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">
                        Source
                      </th>
                      <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">
                        Medium
                      </th>
                      <th className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">
                        Sessions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {trafficSources.slice(0, 10).map((source, index) => (
                      <tr
                        key={`${source.source}-${source.medium}-${index}`}
                        className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 text-sm font-medium text-zinc-900 dark:text-white">
                          {source.source}
                        </td>
                        <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                          {source.medium}
                        </td>
                        <td className="py-3 text-sm font-bold text-zinc-900 dark:text-white text-right">
                          {formatNumber(source.sessions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Top Pages Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-500/10">
                <DocumentTextIcon className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top Pages</h2>
            </div>

            {topPages.length === 0 ? (
              <div className="py-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No page view data available
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/5">
                      <th className="text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">
                        Page Path
                      </th>
                      <th className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider pb-3">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {topPages.slice(0, 10).map((page, index) => (
                      <tr
                        key={`${page.pagePath}-${index}`}
                        className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 text-sm font-medium text-zinc-900 dark:text-white max-w-xs">
                          <span className="block truncate" title={page.pagePath}>
                            {page.pagePath}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-bold text-zinc-900 dark:text-white text-right">
                          {formatNumber(page.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Realtime Section */}
      {!isLoading && !error && realtime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#FFDE1A]/10 to-[#FFDE1A]/5 border border-[#FFDE1A]/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#FFDE1A]/20">
                <SignalIcon className="w-6 h-6 text-[#FFDE1A]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Realtime Overview</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Users currently on your site
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-4xl font-black text-zinc-900 dark:text-white">
                  {isRealtimeLoading ? (
                    <span className="inline-block w-16 h-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  ) : (
                    formatNumber(realtime.activeUsers)
                  )}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Users</p>
              </div>
              <div className="relative">
                <span className="flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFDE1A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FFDE1A]" />
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4">
            Auto-refreshes every 30 seconds
          </p>
        </motion.div>
      )}

      {/* Empty State when no data at all */}
      {!isLoading && !error && !overview && trafficSources.length === 0 && topPages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 text-center"
        >
          <ChartBarIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            No Analytics Data
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Analytics data isn't available yet. This could be because Google Analytics isn't
            configured, or there's no traffic data for the selected date range.
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-[#FFDE1A] hover:bg-[#F8BE00] text-black font-bold rounded-xl transition-colors text-sm shadow-[0_0_20px_-5px_#FFDE1A] active:scale-95"
          >
            Refresh Data
          </button>
        </motion.div>
      )}
    </div>
  )
}
