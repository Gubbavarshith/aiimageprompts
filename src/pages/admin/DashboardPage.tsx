import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PhotoIcon,
  TagIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { PromptAnalyticsChart } from '@/components/admin/PromptAnalyticsChart'
import { fetchPrompts as fetchPromptsFromApi, type PromptRecord } from '@/lib/services/prompts'
import { fetchEmailSubscriptions } from '@/lib/services/emailSubscriptions'
import { isSupabaseReady } from '@/lib/supabaseClient'
import {
  fetchPromptAnalyticsSummary,
  fetchPromptCreationChartData,
  type PromptAnalyticsData,
  type PromptAnalyticsSummary,
  type ChartPeriod,
} from '@/lib/services/promptAnalytics'

const DAY_IN_MS = 24 * 60 * 60 * 1000

const isWithinLastDays = (timestamp: string, days: number) => {
  const created = new Date(timestamp).getTime()
  return Date.now() - created <= days * DAY_IN_MS
}

const formatRelativeTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime()
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < DAY_IN_MS) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  return `${Math.floor(diff / DAY_IN_MS)}d ago`
}


const countRecordsWithinDays = (records: PromptRecord[], days: number) =>
  records.reduce((count, record) => (isWithinLastDays(record.created_at, days) ? count + 1 : count), 0)

export default function DashboardPage() {
  const navigate = useNavigate()
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7days')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [subscriptionsCount, setSubscriptionsCount] = useState(0)
  const [analyticsSummary, setAnalyticsSummary] = useState<PromptAnalyticsSummary | null>(null)
  const [chartData, setChartData] = useState<PromptAnalyticsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabaseReady = isSupabaseReady()

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!supabaseReady) {
        setError('Supabase is not configured. Set VITE_SUPABASE_URL and key, then restart.')
        setPrompts([])
        setSubscriptionsCount(0)
        setAnalyticsSummary(null)
        setChartData([])
        return
      }
      const [promptsData, subscriptionsData, analyticsData, chartDataResult] = await Promise.all([
        fetchPromptsFromApi(),
        fetchEmailSubscriptions().catch(() => []), // Don't fail dashboard if subscriptions fail
        fetchPromptAnalyticsSummary().catch(() => null), // Don't fail dashboard if analytics fail
        fetchPromptCreationChartData(chartPeriod).catch(() => []), // Don't fail dashboard if chart data fails
      ])
      setPrompts(promptsData)
      setSubscriptionsCount(subscriptionsData.length)
      setAnalyticsSummary(analyticsData)
      setChartData(chartDataResult)
    } catch (err) {
      console.error(err)
      setError('Unable to load dashboard data right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [supabaseReady, chartPeriod])

  useEffect(() => {
    document.title = 'Dashboard | AI Image Prompts Admin'
    fetchDashboardData()
  }, [fetchDashboardData])

  // Refetch chart data when period changes
  useEffect(() => {
    if (supabaseReady && !isLoading) {
      fetchPromptCreationChartData(chartPeriod)
        .then(setChartData)
        .catch(err => {
          console.error('Error fetching chart data:', err)
        })
    }
  }, [chartPeriod, supabaseReady, isLoading])

  const totalCategories = useMemo(() => new Set(prompts.map(prompt => prompt.category)).size, [prompts])
  const newPromptsThisWeek = useMemo(() => countRecordsWithinDays(prompts, 7), [prompts])

  const summaryCards = useMemo(
    () => [
      {
        name: 'Total Prompts',
        value: prompts.length.toString(),
        change: newPromptsThisWeek ? `+${newPromptsThisWeek} this week` : 'Stable',
        changeType: newPromptsThisWeek ? 'increase' : 'neutral',
        icon: PhotoIcon,
        description: 'Prompts in library',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'User Submitted',
        value: analyticsSummary?.userSubmittedCount.toString() || '0',
        change: analyticsSummary
          ? `${analyticsSummary.userSubmittedPercentage.toFixed(0)}% of total`
          : 'N/A',
        changeType: 'neutral' as const,
        icon: UserIcon,
        description: 'Prompts from users',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'Admin Created',
        value: analyticsSummary?.adminCreatedCount.toString() || '0',
        change: analyticsSummary
          ? `${analyticsSummary.adminCreatedPercentage.toFixed(0)}% of total`
          : 'N/A',
        changeType: 'neutral' as const,
        icon: ShieldCheckIcon,
        description: 'Prompts by admins',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'This Month',
        value: analyticsSummary?.thisMonthCount.toString() || '0',
        change:
          analyticsSummary && analyticsSummary.lastMonthCount > 0
            ? analyticsSummary.thisMonthCount >= analyticsSummary.lastMonthCount
              ? `+${analyticsSummary.thisMonthCount - analyticsSummary.lastMonthCount} vs last month`
              : `${analyticsSummary.thisMonthCount - analyticsSummary.lastMonthCount} vs last month`
            : 'No comparison',
        changeType:
          analyticsSummary && analyticsSummary.lastMonthCount > 0
            ? analyticsSummary.thisMonthCount >= analyticsSummary.lastMonthCount
              ? 'increase'
              : 'decrease'
            : ('neutral' as const),
        icon: PhotoIcon,
        description: 'Prompts added this month',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'Categories',
        value: totalCategories.toString(),
        change: 'Stable',
        changeType: 'neutral' as const,
        icon: TagIcon,
        description: 'Unique categories',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'Subscriptions',
        value: subscriptionsCount.toLocaleString(),
        change: 'Stable',
        changeType: 'neutral' as const,
        icon: EnvelopeIcon,
        description: 'Email subscribers',
        onClick: () => navigate('/admin/subscriptions'),
      },
      {
        name: 'System Status',
        value: error ? 'Degraded' : supabaseReady ? 'Online' : 'Not configured',
        change: supabaseReady ? 'Stable' : 'Action needed',
        changeType: 'neutral' as const,
        icon: CheckCircleIcon,
        description: supabaseReady ? 'Supabase connectivity' : 'Configure Supabase env vars',
      },
    ],
    [
      prompts.length,
      totalCategories,
      subscriptionsCount,
      newPromptsThisWeek,
      error,
      supabaseReady,
      analyticsSummary,
    ],
  )

  const recentPrompts = useMemo(
    () =>
      prompts.slice(0, 5).map(prompt => ({
        id: prompt.id,
        title: prompt.title,
        time: formatRelativeTime(prompt.created_at),
        image: prompt.preview_image_url,
      })),
    [prompts],
  )



  const handleViewAllPrompts = () => {
    navigate('/admin/prompts')
  }

  const handleRecentPromptClick = (_id: string) => {
    navigate(`/admin/prompts`)
  }



  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      if (new Date(customStartDate) > new Date(customEndDate)) {
        setError('Start date must be before end date')
        return
      }
      setChartPeriod({ startDate: customStartDate, endDate: customEndDate })
      setShowCustomDatePicker(false)
      setError(null)
    }
  }

  const handleCustomDateCancel = () => {
    setShowCustomDatePicker(false)
    // Reset to last valid period if canceling
    if (typeof chartPeriod === 'object') {
      setCustomStartDate(chartPeriod.startDate)
      setCustomEndDate(chartPeriod.endDate)
    } else {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of your prompt library performance.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <span className="flex h-3 w-3 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${error ? 'bg-red-500' : 'bg-[#FFDE1A]'
                } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${error ? 'bg-red-500' : 'bg-[#FFDE1A]'}`}
            />
          </span>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {error ? 'Data issues' : 'Live Updates'}
          </span>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors active:scale-95"
          >
            Refresh
          </button>
        </motion.div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all group relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-none cursor-pointer active:scale-95"
            onClick={stat.onClick}
          >
            <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity transform rotate-12 group-hover:scale-110 duration-500">
              <stat.icon className="w-32 h-32 text-zinc-900 dark:text-white" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 group-hover:border-[#FFDE1A]/20 group-hover:bg-[#FFDE1A]/10 transition-colors">
                  <stat.icon className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-yellow-600 dark:group-hover:text-[#FFDE1A]" />
                </div>
                {stat.change !== 'Stable' && (
                  <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.changeType === 'increase' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    stat.changeType === 'decrease' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                      'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                    }`}>
                    {stat.changeType === 'increase' && <ArrowUpIcon className="w-3 h-3 stroke-[3px]" />}
                    {stat.changeType === 'decrease' && <ArrowDownIcon className="w-3 h-3 stroke-[3px]" />}
                    {stat.change}
                  </div>
                )}
              </div>

              <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart - Full Width */}
      <PromptAnalyticsChart
        data={chartData}
        isLoading={isLoading}
        period={chartPeriod}
        onPeriodChange={(value) => {
          if (value === 'custom') {
            if (typeof chartPeriod === 'object') {
              setCustomStartDate(chartPeriod.startDate)
              setCustomEndDate(chartPeriod.endDate)
            }
            setShowCustomDatePicker(true)
          } else {
            setShowCustomDatePicker(false)
            setChartPeriod(value as ChartPeriod)
          }
        }}
        showCustomDatePicker={showCustomDatePicker}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start)
          setCustomEndDate(end)
        }}
        onCustomDateApply={handleCustomDateApply}
        onCustomDateCancel={handleCustomDateCancel}
        setShowCustomDatePicker={setShowCustomDatePicker}
      />

      {/* Recent Prompts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Prompts</h2>
          <button
            onClick={handleViewAllPrompts}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            View All →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isLoading ? (
            <div className="col-span-full text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              Loading recent prompts...
            </div>
          ) : recentPrompts.length === 0 ? (
            <div className="col-span-full text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
              No prompts found yet.
            </div>
          ) : (
            recentPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => handleRecentPromptClick(prompt.id)}
                className="flex flex-col gap-3 p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/5 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-full aspect-square rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center overflow-hidden relative">
                  {prompt.image ? (
                    <img
                      src={prompt.image}
                      alt={prompt.title}
                      width="100%"
                      height="100%"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 group-hover:text-[#d4a000] dark:group-hover:text-[#FFDE1A] transition-colors">
                    {prompt.title}
                  </h4>
                  <p className="text-xs font-medium text-zinc-500 mt-1">Added {prompt.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
