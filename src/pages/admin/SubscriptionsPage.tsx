import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  EnvelopeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import {
  fetchEmailSubscriptions,
  deleteEmailSubscription,
  type EmailSubscription,
} from '@/lib/services/emailSubscriptions'
import { useToast } from '@/contexts/ToastContext'
import { isSupabaseReady } from '@/lib/supabaseClient'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const exportToCSV = (subscriptions: EmailSubscription[]) => {
  const headers = ['Email', 'Country', 'Region', 'City', 'Timezone', 'IP Address', 'Subscribed Date']
  const rows = subscriptions.map(sub => [
    sub.email,
    sub.country || '',
    sub.region || '',
    sub.city || '',
    sub.timezone || '',
    sub.ip_address || '',
    formatDate(sub.created_at),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `email-subscriptions-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; email: string } | null>(null)
  const supabaseReady = isSupabaseReady()
  const toast = useToast()

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!supabaseReady) {
        setError('Database is not configured. Set VITE_SUPABASE_URL and key, then restart.')
        setSubscriptions([])
        return
      }
      const data = await fetchEmailSubscriptions()
      setSubscriptions(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load subscriptions right now. Please try again.')
      toast.error('Failed to load email subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [supabaseReady, toast])

  useEffect(() => {
    document.title = 'Email Subscriptions | AI Image Prompts Admin'
    loadSubscriptions()
  }, [loadSubscriptions])

  // Handle escape key to close delete confirmation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteConfirm) {
        setShowDeleteConfirm(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showDeleteConfirm])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteEmailSubscription(id)
      if (result.success) {
        setSubscriptions(prev => prev.filter(sub => sub.id !== id))
        toast.success('Subscription deleted successfully')
        setShowDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete subscription')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sub.email.toLowerCase().includes(searchLower) ||
      sub.country?.toLowerCase().includes(searchLower) ||
      sub.city?.toLowerCase().includes(searchLower) ||
      sub.region?.toLowerCase().includes(searchLower)
    )
  })

  const isEmptyState = !isLoading && subscriptions.length === 0
  const hasNoResults = !isLoading && subscriptions.length > 0 && filteredSubscriptions.length === 0

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
              <EnvelopeIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Email Subscriptions
            </h1>
            {/* Subscription Count Pill - Always visible */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                subscriptions.length > 0 
                  ? 'bg-[#FFDE1A] text-black' 
                  : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <EnvelopeIcon className="w-4 h-4" />
              <span>{subscriptions.length}</span>
            </motion.div>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage newsletter email subscriptions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {subscriptions.length > 0 && (
            <button
              onClick={() => exportToCSV(subscriptions)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors text-sm font-medium text-zinc-900 dark:text-white"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={loadSubscriptions}
            disabled={isLoading}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </motion.div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      {subscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50 focus:border-transparent transition-all"
          />
        </motion.div>
      )}

      {/* Subscriptions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading subscriptions...</p>
          </div>
        ) : isEmptyState ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              No subscriptions yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Email subscriptions will appear here once users subscribe via the footer.
            </p>
          </div>
        ) : hasNoResults ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No subscriptions found matching "{searchTerm}"
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-white/5">
            {filteredSubscriptions.map((subscription, index) => (
              <motion.div
                key={subscription.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/20 flex items-center justify-center shrink-0">
                      <EnvelopeIcon className="w-6 h-6 text-[#FFDE1A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {subscription.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Subscribed on {formatDate(subscription.created_at)}
                        </p>
                        {subscription.country && (
                          <>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {subscription.city && `${subscription.city}, `}
                              {subscription.country}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm({ id: subscription.id, email: subscription.email })}
                    disabled={deletingId === subscription.id}
                    className="p-2.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/delete"
                    title="Delete subscription"
                  >
                    {deletingId === subscription.id ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-5 h-5 group-hover/delete:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 p-6 max-w-md w-full shadow-xl pointer-events-auto">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  Delete Subscription?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to remove <span className="font-medium text-zinc-900 dark:text-white">{showDeleteConfirm.email}</span> from the subscription list? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deletingId === showDeleteConfirm.id}
                    className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors text-sm font-medium text-zinc-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm.id)}
                    disabled={deletingId === showDeleteConfirm.id}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === showDeleteConfirm.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

