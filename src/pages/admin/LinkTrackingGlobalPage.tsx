import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LinkIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  getGlobalAnalytics,
} from '@/lib/services/linkAnalytics'
import { useToast } from '@/contexts/ToastContext'

export default function LinkTrackingGlobalPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalClicks, setTotalClicks] = useState(0)
  const [topLinks, setTopLinks] = useState<any[]>([])
  const [inactiveLinks, setInactiveLinks] = useState<any[]>([])
  const [days, setDays] = useState(30)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endDate = new Date().toISOString()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString()

      const data = await getGlobalAnalytics({
        start: startDateStr,
        end: endDate,
      })

      setTotalClicks(data.total_clicks)
      setTopLinks(data.top_links)
      setInactiveLinks(data.inactive_links)
    } catch (err: any) {
      console.error(err)
      setError(`Failed to load global analytics: ${err.message}`)
      toast.error('Failed to load global analytics')
    } finally {
      setIsLoading(false)
    }
  }, [days, toast])

  useEffect(() => {
    document.title = 'Global Link Analytics | AI Image Prompts Admin'
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FFDE1A]/10 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Global Link Analytics
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-11">
            Overview of all tracked links performance
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Total Clicks Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#FFDE1A]/10 rounded-lg">
            <LinkIcon className="w-8 h-8 text-[#FFDE1A]" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Clicks (Last {days} days)</p>
            <p className="text-4xl font-bold text-zinc-900 dark:text-white">
              {totalClicks.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Top Performing Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Top Performing Links</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Links with the most clicks</p>
        </div>
        {topLinks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            No clicks recorded in the selected period
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {topLinks.map((link, index) => (
              <div
                key={link.link_id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/links/${link.link_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFDE1A]/10 flex items-center justify-center text-sm font-bold text-[#FFDE1A]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{link.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Link ID: {link.link_id.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{link.clicks.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">clicks</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-zinc-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Inactive Links */}
      {inactiveLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
        >
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Inactive Links</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Links with no clicks in the last 30 days</p>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {inactiveLinks.map((link) => (
              <div
                key={link.link_id}
                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/links/${link.link_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{link.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Link ID: {link.link_id.substring(0, 8)}...</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

