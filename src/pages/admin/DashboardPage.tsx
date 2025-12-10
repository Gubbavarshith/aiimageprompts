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
} from '@heroicons/react/24/outline'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { fetchPrompts as fetchPromptsFromApi, type PromptRecord } from '@/lib/services/prompts'
import { fetchEmailSubscriptions } from '@/lib/services/emailSubscriptions'
import { isSupabaseReady } from '@/lib/supabaseClient'

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

const buildChartData = (records: PromptRecord[], days: number) => {
  const buckets: { key: string; name: string; views: number }[] = []
  const lookup = new Map<string, number>()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)

    const key = date.toISOString().split('T')[0]
    const label =
      days <= 7
        ? date.toLocaleDateString(undefined, { weekday: 'short' })
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    buckets.push({ key, name: label, views: 0 })
    lookup.set(key, buckets.length - 1)
  }

  records.forEach(record => {
    const date = new Date(record.created_at)
    date.setHours(0, 0, 0, 0)
    const key = date.toISOString().split('T')[0]
    const idx = lookup.get(key)
    if (typeof idx === 'number') {
      buckets[idx].views += record.views
    }
  })

  return buckets.map(({ name, views }) => ({ name, views }))
}

const countRecordsWithinDays = (records: PromptRecord[], days: number) =>
  records.reduce((count, record) => (isWithinLastDays(record.created_at, days) ? count + 1 : count), 0)

const sumViewsWithinDays = (records: PromptRecord[], days: number) =>
  records.reduce((sum, record) => (isWithinLastDays(record.created_at, days) ? sum + record.views : sum), 0)

export default function DashboardPage() {
  const navigate = useNavigate()
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days'>('7days')
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [subscriptionsCount, setSubscriptionsCount] = useState(0)
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
        return
      }
      const [promptsData, subscriptionsData] = await Promise.all([
        fetchPromptsFromApi(),
        fetchEmailSubscriptions().catch(() => []) // Don't fail dashboard if subscriptions fail
      ])
      setPrompts(promptsData)
      setSubscriptionsCount(subscriptionsData.length)
    } catch (err) {
      console.error(err)
      setError('Unable to load dashboard data right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [supabaseReady])

  useEffect(() => {
    document.title = 'Dashboard | AI Image Prompts Admin'
    fetchDashboardData()
  }, [fetchDashboardData])

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
        name: 'Categories',
        value: totalCategories.toString(),
        change: 'Stable',
        changeType: 'neutral',
        icon: TagIcon,
        description: 'Unique categories',
        onClick: () => navigate('/admin/prompts'),
      },
      {
        name: 'Subscriptions',
        value: subscriptionsCount.toLocaleString(),
        change: 'Stable',
        changeType: 'neutral',
        icon: EnvelopeIcon,
        description: 'Email subscribers',
        onClick: () => navigate('/admin/subscriptions'),
      },
      {
        name: 'System Status',
        value: error ? 'Degraded' : supabaseReady ? 'Online' : 'Not configured',
        change: supabaseReady ? 'Stable' : 'Action needed',
        changeType: 'neutral',
        icon: CheckCircleIcon,
        description: supabaseReady ? 'Supabase connectivity' : 'Configure Supabase env vars',
      },
    ],
    [prompts.length, totalCategories, subscriptionsCount, newPromptsThisWeek, error, supabaseReady],
  )

  const chartData = useMemo(
    () => buildChartData(prompts, chartPeriod === '7days' ? 7 : 30),
    [prompts, chartPeriod],
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

  const isEmptyState = !isLoading && prompts.length === 0

  const handleViewAllPrompts = () => {
    navigate('/admin/prompts')
  }

  const handleRecentPromptClick = (_id: string) => {
    navigate(`/admin/prompts`)
  }

  const handleChartPeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartPeriod(e.target.value as '7days' | '30days')
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Traffic Overview</h2>
            <select
              value={chartPeriod}
              onChange={handleChartPeriodChange}
              className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-xs font-medium text-zinc-900 dark:text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#FFDE1A]/50 transition-colors cursor-pointer"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>

          <div className="h-80 w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading chart...
              </div>
            ) : isEmptyState ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400 text-center px-6">
                Add prompts to see real-time traffic trends here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFDE1A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFDE1A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    tickMargin={10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#FFDE1A', fontWeight: 'bold' }}
                    cursor={{ stroke: '#FFDE1A', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#FFDE1A"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Quick Actions / Recent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 flex flex-col shadow-sm dark:shadow-none h-full"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Prompts</h2>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading recent prompts...</div>
            ) : recentPrompts.length === 0 ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">No prompts found yet.</div>
            ) : (
              recentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handleRecentPromptClick(prompt.id)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-white/5 transition-all cursor-pointer group active:scale-95"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {prompt.image ? (
                      <img
                        src={prompt.image}
                        alt={prompt.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <PhotoIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#d4a000] dark:group-hover:text-[#FFDE1A] transition-colors">
                      {prompt.title}
                    </h4>
                    <p className="text-xs font-medium text-zinc-500 mt-0.5">Added {prompt.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleViewAllPrompts}
            className="mt-6 w-full py-3.5 rounded-xl border-2 border-zinc-900 dark:border-white text-sm font-bold text-zinc-900 dark:text-white hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 uppercase tracking-wide"
          >
            View All Prompts
          </button>
        </motion.div>
      </div>
    </div>
  )
}
