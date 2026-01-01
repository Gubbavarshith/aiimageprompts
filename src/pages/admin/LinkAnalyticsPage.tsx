import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  getTrackedLinkById,
  type TrackedLink,
} from '@/lib/services/trackedLinks'
import {
  getAnalyticsSummary,
  getDailyClicks,
  getTrafficSources,
  getDeviceBreakdown,
  getCountryBreakdown,
  getRecentClicks,
  type LinkAnalyticsRecord,
} from '@/lib/services/linkAnalytics'
import { useToast } from '@/contexts/ToastContext'

const SITE_URL = 'https://aiimageprompts.xyz'

const COLORS = ['#FFDE1A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LinkAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [link, setLink] = useState<TrackedLink | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [dailyClicks, setDailyClicks] = useState<any[]>([])
  const [trafficSources, setTrafficSources] = useState<any[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([])
  const [countryBreakdown, setCountryBreakdown] = useState<any[]>([])
  const [recentClicks, setRecentClicks] = useState<LinkAnalyticsRecord[]>([])
  const [days, setDays] = useState(30)

  const loadData = useCallback(async () => {
    if (!id) return

    setIsLoading(true)
    setError(null)

    try {
      const [linkData, summaryData, dailyData, sourcesData, devicesData, countriesData, recentData] = await Promise.all([
        getTrackedLinkById(id),
        getAnalyticsSummary(id),
        getDailyClicks(id, days),
        getTrafficSources(id),
        getDeviceBreakdown(id),
        getCountryBreakdown(id),
        getRecentClicks(id, 50),
      ])

      if (!linkData) {
        setError('Link not found')
        return
      }

      setLink(linkData)
      setSummary(summaryData)
      setDailyClicks(dailyData)
      setTrafficSources(sourcesData.slice(0, 10))
      setDeviceBreakdown(devicesData)
      setCountryBreakdown(countriesData.slice(0, 10))
      setRecentClicks(recentData)
    } catch (err: any) {
      console.error(err)
      setError(`Failed to load analytics: ${err.message}`)
      toast.error('Failed to load link analytics')
    } finally {
      setIsLoading(false)
    }
  }, [id, days, toast])

  useEffect(() => {
    document.title = 'Link Analytics | AI Image Prompts Admin'
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="space-y-8">
        <button
          onClick={() => navigate('/admin/links')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Links
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error || 'Link not found'}
        </div>
      </div>
    )
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
          <button
            onClick={() => navigate('/admin/links')}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Links
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FFDE1A]/10 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Link Analytics
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-11">
            {link.campaign_name} • {link.platform}
          </p>
        </motion.div>
      </div>

      {/* Link Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Short URL</p>
            <code className="text-sm font-mono text-[#FFDE1A] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {SITE_URL}/go/{link.unique_id}
            </code>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Destination</p>
            <p className="text-sm text-zinc-900 dark:text-white truncate" title={link.destination_url}>
              {link.destination_url}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              link.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {link.status === 'active' ? 'Active' : 'Paused'}
            </span>
          </div>
          {link.notes && (
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Notes</p>
              <p className="text-sm text-zinc-900 dark:text-white">{link.notes}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Clicks</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {summary?.total_clicks.toLocaleString() || 0}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Unique Clicks</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {summary?.unique_clicks.toLocaleString() || 0}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Desktop</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {summary?.device_breakdown?.desktop.toLocaleString() || 0}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Mobile</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {summary?.device_breakdown?.mobile.toLocaleString() || 0}
          </p>
        </motion.div>
      </div>

      {/* Daily Clicks Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Daily Clicks</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Click activity over time</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyClicks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDate(value)}
              stroke="#71717a"
            />
            <YAxis stroke="#71717a" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke="#FFDE1A"
              strokeWidth={2}
              name="Total Clicks"
            />
            <Line
              type="monotone"
              dataKey="unique_clicks"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Unique Clicks"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Device Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const percent = props.percent
                  const device = props.device || ''
                  return percent !== undefined && device ? `${device}: ${(percent * 100).toFixed(0)}%` : ''
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {deviceBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trafficSources}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="source"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#71717a"
              />
              <YAxis stroke="#71717a" />
              <Tooltip />
              <Bar dataKey="count" fill="#FFDE1A" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Country Breakdown */}
      {countryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Top Countries</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" stroke="#71717a" />
              <YAxis dataKey="country" type="category" stroke="#71717a" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Clicks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Clicks</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Latest 50 clicks with details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Timestamp</th>
                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Device</th>
                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">OS / Browser</th>
                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Country</th>
                <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentClicks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    No clicks recorded yet
                  </td>
                </tr>
              ) : (
                recentClicks.map((click) => (
                  <tr key={click.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(click.timestamp)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {click.device_type}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {click.operating_system && click.browser
                        ? `${click.operating_system} / ${click.browser}`
                        : click.operating_system || click.browser || 'Unknown'}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      {click.country || 'Unknown'}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">
                      <div className="max-w-xs truncate" title={click.referrer || 'direct'}>
                        {click.referrer || 'direct'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

