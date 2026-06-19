import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import {
  fetchContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getUnreadContactMessagesCount,
  type ContactMessage,
  type ContactMessageStatus,
} from '@/lib/services/contactMessages'
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

const getStatusBadgeColor = (status: ContactMessageStatus) => {
  switch (status) {
    case 'new':
      return 'bg-yellow-500 text-black'
    case 'read':
      return 'bg-blue-500 text-white'
    case 'replied':
      return 'bg-green-500 text-white'
    case 'archived':
      return 'bg-zinc-500 text-white'
    default:
      return 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
  }
}

const getStatusLabel = (status: ContactMessageStatus) => {
  switch (status) {
    case 'new':
      return 'New'
    case 'read':
      return 'Read'
    case 'replied':
      return 'Replied'
    case 'archived':
      return 'Archived'
    default:
      return status
  }
}

const exportToCSV = (messages: ContactMessage[]) => {
  const headers = ['Name', 'Email', 'Message', 'Status', 'IP Address', 'Date']
  const rows = messages.map(msg => [
    msg.name,
    msg.email,
    msg.message.replace(/"/g, '""'), // Escape quotes for CSV
    msg.status,
    msg.ip_address || '',
    formatDate(msg.created_at),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `contact-messages-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'all'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabaseReady = isSupabaseReady()
  const toast = useToast()

  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!supabaseReady) {
        setError('Database is not configured. Set VITE_SUPABASE_URL and key, then restart.')
        setMessages([])
        setIsLoading(false)
        return
      }
      const [data, count] = await Promise.all([
        fetchContactMessages(),
        getUnreadContactMessagesCount(),
      ])
      setMessages(data)
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading contact messages:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unable to load messages right now. Please try again.'
      setError(errorMessage)
      // Only show toast if it's not a permission error (which would be expected for non-admins)
      if (!errorMessage.includes('permission') && !errorMessage.includes('42501')) {
        toast.error('Failed to load contact messages')
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabaseReady, toast])

  useEffect(() => {
    document.title = 'Contact Messages | AI Image Prompts Admin'
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

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

  const handleStatusUpdate = async (id: string, newStatus: ContactMessageStatus) => {
    setUpdatingId(id)
    try {
      const result = await updateContactMessageStatus(id, newStatus)
      if (result.success) {
        setMessages(prev =>
          prev.map(msg => (msg.id === id ? { ...msg, status: newStatus } : msg))
        )
        // Refresh unread count
        const count = await getUnreadContactMessagesCount()
        setUnreadCount(count)
        toast.success(`Message marked as ${getStatusLabel(newStatus).toLowerCase()}`)
      } else {
        toast.error(result.error || 'Failed to update message status')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteContactMessage(id)
      if (result.success) {
        setMessages(prev => prev.filter(msg => msg.id !== id))
        // Refresh unread count
        const count = await getUnreadContactMessagesCount()
        setUnreadCount(count)
        toast.success('Message deleted successfully')
        setShowDeleteConfirm(null)
      } else {
        toast.error(result.error || 'Failed to delete message')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredMessages = messages.filter(msg => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isEmptyState = !isLoading && messages.length === 0
  const hasNoResults = !isLoading && messages.length > 0 && filteredMessages.length === 0

  const statusOptions: Array<ContactMessageStatus | 'all'> = ['all', 'new', 'read', 'replied', 'archived']

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
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Contact Messages
            </h1>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-yellow-500 text-black shadow-lg"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>{unreadCount} new</span>
              </motion.div>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            View and manage contact form submissions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {messages.length > 0 && (
            <button
              onClick={() => exportToCSV(messages)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors text-sm font-medium text-zinc-900 dark:text-white"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export CSV
            </button>
          )}
          <button
            onClick={loadMessages}
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

      {/* Filters */}
      {messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-[#FFDE1A] text-black shadow-lg'
                    : 'bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
                {status === 'new' && messages.filter(m => m.status === 'new').length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-black/10 text-xs">
                    {messages.filter(m => m.status === 'new').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>
      )}

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading messages...</p>
          </div>
        ) : isEmptyState ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Contact form submissions will appear here once users send messages.
            </p>
          </div>
        ) : hasNoResults ? (
          <div className="p-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No messages found matching your filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-white/5">
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-6 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${
                  message.status === 'new' ? 'bg-yellow-50/50 dark:bg-yellow-500/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/20 flex items-center justify-center shrink-0">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-[#FFDE1A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">
                            {message.name}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeColor(message.status)}`}>
                            {getStatusLabel(message.status)}
                          </span>
                          {message.subject && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                              {message.subject}
                            </span>
                          )}
                        </div>
                        <a
                          href={`mailto:${message.email}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {message.email}
                        </a>
                      </div>
                    </div>

                    <div className="ml-13 mt-3">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                        {expandedId === message.id || message.message.length < 200
                          ? message.message
                          : `${message.message.substring(0, 200)}...`}
                      </p>
                      {message.message.length > 200 && (
                        <button
                          onClick={() => setExpandedId(expandedId === message.id ? null : message.id)}
                          className="mt-2 text-xs font-medium text-[#FFDE1A] hover:underline"
                        >
                          {expandedId === message.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3 ml-13">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(message.created_at)}
                      </p>
                      {message.ip_address && (
                        <>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">•</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            IP: {message.ip_address}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Update Buttons */}
                    {message.status !== 'read' && (
                      <button
                        onClick={() => handleStatusUpdate(message.id, 'read')}
                        disabled={updatingId === message.id}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all disabled:opacity-50"
                        title="Mark as read"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                    )}
                    {message.status !== 'replied' && (
                      <button
                        onClick={() => handleStatusUpdate(message.id, 'replied')}
                        disabled={updatingId === message.id}
                        className="p-2 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all disabled:opacity-50"
                        title="Mark as replied"
                      >
                        <EnvelopeIcon className="w-5 h-5" />
                      </button>
                    )}
                    {message.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusUpdate(message.id, 'archived')}
                        disabled={updatingId === message.id}
                        className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 transition-all disabled:opacity-50"
                        title="Archive"
                      >
                        <ArchiveBoxIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm({ id: message.id, name: message.name })}
                      disabled={deletingId === message.id}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Delete message"
                    >
                      {deletingId === message.id ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
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
                  Delete Message?
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to delete the message from <span className="font-medium text-zinc-900 dark:text-white">{showDeleteConfirm.name}</span>? This action cannot be undone.
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
