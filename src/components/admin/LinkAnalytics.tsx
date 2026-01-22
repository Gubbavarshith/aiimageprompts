import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  ArrowLeftIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LinkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  getLinkAnalytics,
  getOverallLinkAnalytics,
  type LinkAnalytics as LinkAnalyticsData,
  type TrackedLink,
} from '@/lib/services/trackedLinks'

interface LinkAnalyticsProps {
  link?: TrackedLink | null
  onBack?: () => void
}

const COLORS = ['#FFDE1A', '#8B5CF6', '#10B981', '#F97316', '#EC4899', '#06B6D4', '#6366F1']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
        <p className="font-semibold text-sm mb-2 text-zinc-500 dark:text-zinc-400">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-zinc-700 dark:text-zinc-300">{entry.name}:</span>
            <span className="ml-auto font-bold text-zinc-900 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function LinkAnalytics({ link, onBack }: LinkAnalyticsProps) {
  const [analytics, setAnalytics] = useState<LinkAnalyticsData | null>(null)
  const [overallStats, setOverallStats] = useState<{
    totalLinks: number
    activeLinks: number
    totalClicks: number
    topLinks: Array<{ link: TrackedLink; clicks: number }>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days')

  const getDateRange = useCallback(() => {
    const now = new Date()
    let startDate: string | undefined

    switch (dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        startDate = undefined
    }

    return { startDate, endDate: now.toISOString() }
  }, [dateRange])

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      if (link) {
        const data = await getLinkAnalytics(link.id, startDate, endDate)
        setAnalytics(data)
      } else {
        const data = await getOverallLinkAnalytics(startDate, endDate)
        setOverallStats(data)
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [link, getDateRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  // Fill missing dates for chart
  const chartData = useMemo(() => {
    if (!analytics?.clicksByDate) return []

    const { startDate } = getDateRange()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = new Date()
    const dateMap = new Map(analytics.clicksByDate.map(d => [d.date, d.count]))
    const result = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        label: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        clicks: dateMap.get(dateStr) || 0,
      })
    }

    return result
  }, [analytics, getDateRange])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-[#FFDE1A] animate-spin" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading analytics...</span>
      </div>
    )
  }

  // Individual link analytics view
  if (link && analytics) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
              {link.title || link.slug}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{link.destination}</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          {(['7days', '30days', '90days', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-[#FFDE1A] text-black'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#FFDE1A]/10">
                <CursorArrowRaysIcon className="w-5 h-5 text-[#FFDE1A]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{analytics.totalClicks}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Clicks</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <GlobeAltIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{analytics.uniqueClicks}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Unique Visitors</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DevicePhoneMobileIcon className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {analytics.clicksByDevice.length}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Device Types</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <LinkIcon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {analytics.clicksByReferrer.length}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Referrers</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Clicks Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
        >
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Clicks Over Time</h3>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400">No click data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFDE1A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFDE1A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis dataKey="label" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#FFDE1A"
                    strokeWidth={2}
                    fill="url(#clickGradient)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#FFDE1A' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Device & Referrer Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Device Breakdown</h3>
            {analytics.clicksByDevice.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-zinc-400">No data</div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.clicksByDevice}
                      dataKey="count"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {analytics.clicksByDevice.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {analytics.clicksByDevice.map((item, index) => (
                <div key={item.device} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-zinc-600 dark:text-zinc-400 capitalize">{item.device}</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Referrers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Top Referrers</h3>
            {analytics.clicksByReferrer.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-zinc-400">No referrer data</div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.clicksByReferrer.slice(0, 5)} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" stroke="#A1A1AA" fontSize={12} />
                    <YAxis type="category" dataKey="referrer" stroke="#A1A1AA" fontSize={12} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FFDE1A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Overall analytics view (no specific link selected)
  if (!link && overallStats) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Link Analytics Overview</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aggregate statistics across all tracked links</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#FFDE1A]/10">
                <LinkIcon className="w-6 h-6 text-[#FFDE1A]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overallStats.totalLinks}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Links</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CursorArrowRaysIcon className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overallStats.activeLinks}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Links</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <GlobeAltIcon className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{overallStats.totalClicks}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Clicks</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top Performing Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10"
        >
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Top Performing Links</h3>
          {overallStats.topLinks.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">No links with clicks yet</div>
          ) : (
            <div className="space-y-3">
              {overallStats.topLinks.map((item, index) => (
                <div
                  key={item.link.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5"
                >
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-[#FFDE1A]/20 text-[#FFDE1A]">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {item.link.title || item.link.slug}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">{item.link.destination}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">{item.clicks}</p>
                    <p className="text-xs text-zinc-500">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return null
}

