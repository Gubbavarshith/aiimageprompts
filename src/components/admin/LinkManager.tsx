import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import {
  getTrackedLinks,
  deleteTrackedLink,
  deleteTrackedLinks,
  toggleLinkActive,
  buildTrackingUrl,
  getUniqueCampaigns,
  type TrackedLinkWithStats,
  type TrackedLinkFilters,
} from '@/lib/services/trackedLinks'
import { useToast } from '@/contexts/ToastContext'

interface LinkManagerProps {
  onEdit?: (link: TrackedLinkWithStats) => void
  onViewAnalytics?: (link: TrackedLinkWithStats) => void
  refreshTrigger?: number
}

const DEFAULT_ITEMS_PER_PAGE = 10

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`
}

export default function LinkManager({ onEdit, onViewAnalytics, refreshTrigger }: LinkManagerProps) {
  const [links, setLinks] = useState<TrackedLinkWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TrackedLinkWithStats | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Bulk selection
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const toast = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadLinks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const filters: TrackedLinkFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (campaignFilter !== 'all') filters.campaign = campaignFilter
      if (statusFilter !== 'all') filters.isActive = statusFilter === 'active'

      const data = await getTrackedLinks(filters)
      setLinks(data)
    } catch (err) {
      console.error('Error loading links:', err)
      setError('Unable to load links. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, campaignFilter, statusFilter])

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getUniqueCampaigns()
      setCampaigns(data)
    } catch (err) {
      console.error('Error loading campaigns:', err)
    }
  }, [])

  useEffect(() => {
    loadLinks()
    loadCampaigns()
  }, [loadLinks, loadCampaigns, refreshTrigger])

  // Keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isInputFocused) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(null)
        if (showBulkDeleteConfirm) setShowBulkDeleteConfirm(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showDeleteConfirm, showBulkDeleteConfirm])

  // Pagination
  const filteredLinks = useMemo(() => links, [links])
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLinks = filteredLinks.slice(startIndex, endIndex)

  const handleCopyLink = async (link: TrackedLinkWithStats) => {
    const url = buildTrackingUrl(link.slug)
    await navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Link copied to clipboard!')
  }

  const handleToggleActive = async (link: TrackedLinkWithStats) => {
    setTogglingId(link.id)
    try {
      await toggleLinkActive(link.id, !link.is_active)
      await loadLinks()
      toast.success(`Link ${link.is_active ? 'deactivated' : 'activated'} successfully!`)
    } catch (err) {
      console.error('Error toggling link:', err)
      toast.error('Failed to update link status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteClick = (link: TrackedLinkWithStats) => {
    setShowDeleteConfirm(link)
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return

    const { id } = showDeleteConfirm
    setShowDeleteConfirm(null)
    setDeletingId(id)

    try {
      await deleteTrackedLink(id)
      await loadLinks()
      toast.success('Link deleted successfully!')
    } catch (err) {
      console.error('Error deleting link:', err)
      toast.error('Failed to delete link')
    } finally {
      setDeletingId(null)
    }
  }

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedLinks.length) {
      setSelectedIds(new Set())
    } else {
      const newSelected = new Set(selectedIds)
      paginatedLinks.forEach(l => newSelected.add(l.id))
      setSelectedIds(newSelected)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true)
    try {
      await deleteTrackedLinks(Array.from(selectedIds))
      await loadLinks()
      setSelectedIds(new Set())
      setShowBulkDeleteConfirm(false)
      setIsSelectionMode(false)
      toast.success(`Deleted ${selectedIds.size} links successfully!`)
    } catch (err) {
      console.error('Error bulk deleting:', err)
      toast.error('Failed to delete selected links')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCampaignFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || campaignFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Select Button */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              if (isSelectionMode) setSelectedIds(new Set())
            }}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors text-sm font-medium min-w-[100px] justify-center ${
              isSelectionMode
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white hover:opacity-90'
                : 'bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-300'
            }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </button>

          {/* Bulk Delete */}
          <AnimatePresence>
            {isSelectionMode && selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, width: 0, padding: 0 }}
                animate={{ opacity: 1, width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}
                exit={{ opacity: 0, width: 0, padding: 0 }}
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="overflow-hidden flex items-center gap-2 py-3 bg-red-500 text-white border border-red-600 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 whitespace-nowrap"
              >
                <TrashIcon className="w-5 h-5 shrink-0" />
                <span className="shrink-0">Delete ({selectedIds.size})</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors text-sm font-medium ${
              showFilters || hasActiveFilters
                ? 'bg-[#FFDE1A]/10 border-[#FFDE1A]/50 text-[#FFDE1A]'
                : 'bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-300'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#FFDE1A] text-black text-xs font-bold rounded-full">
                {[campaignFilter !== 'all' ? 1 : 0, statusFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Filter Options</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Campaign</label>
                    <select
                      value={campaignFilter}
                      onChange={(e) => { setCampaignFilter(e.target.value); setCurrentPage(1) }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none"
                    >
                      <option value="all">All Campaigns</option>
                      {campaigns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Links Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center animate-pulse text-zinc-500 dark:text-zinc-400">
              Loading links...
            </div>
          ) : paginatedLinks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400">
                {error ?? 'No tracked links found.'}
              </p>
              {hasActiveFilters && !error && (
                <button onClick={clearFilters} className="text-sm text-[#FFDE1A] hover:underline">
                  Clear filters
                </button>
              )}
              {error && (
                <button onClick={loadLinks} className="text-sm text-[#FFDE1A] hover:underline">
                  Retry
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
                  {isSelectionMode && (
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={paginatedLinks.every(l => selectedIds.has(l.id)) && paginatedLinks.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Link Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {paginatedLinks.map((link, index) => (
                  <motion.tr
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group transition-colors ${
                      selectedIds.has(link.id)
                        ? 'bg-[#FFDE1A]/5'
                        : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                    }`}
                    onClick={() => isSelectionMode && toggleSelection(link.id)}
                  >
                    {isSelectionMode && (
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(link.id)}
                          onChange={() => toggleSelection(link.id)}
                          className="w-4 h-4 rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">
                          {link.title || 'Untitled Link'}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate max-w-[200px]">
                          {link.destination}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded">
                        {link.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {link.click_count.toLocaleString()}
                        </span>
                        {link.last_clicked_at && (
                          <span className="text-xs text-zinc-500">
                            ({formatRelativeTime(link.last_clicked_at)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {link.utm_campaign ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {link.utm_campaign}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        link.is_active
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                          : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${link.is_active ? 'bg-green-500' : 'bg-zinc-400'}`} />
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCopyLink(link)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          {copiedId === link.id ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => window.open(link.destination, '_blank')}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                          title="Open destination"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </button>
                        {onViewAnalytics && (
                          <button
                            onClick={() => onViewAnalytics(link)}
                            className="p-2 text-zinc-400 hover:text-[#FFDE1A] hover:bg-[#FFDE1A]/10 rounded-lg transition-colors"
                            title="View analytics"
                          >
                            <ChartBarIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(link)}
                          disabled={togglingId === link.id}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                          title={link.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {link.is_active ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                        {onEdit && (
                          <button
                            onClick={() => onEdit(link)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit link"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(link)}
                          disabled={deletingId === link.id}
                          className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredLinks.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#0c0c0e]">
            <p className="text-xs text-zinc-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredLinks.length)} of {filteredLinks.length} links
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                  className="px-2 py-1 text-xs bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-zinc-400 border-zinc-200 dark:border-white/5 cursor-not-allowed bg-zinc-100 dark:bg-transparent'
                    : 'text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-zinc-400 border-zinc-200 dark:border-white/5 cursor-not-allowed bg-zinc-100 dark:bg-transparent'
                    : 'text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete Link</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to delete "{showDeleteConfirm.title || showDeleteConfirm.slug}"? 
                  This will also delete all click analytics for this link.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete {selectedIds.size} Links?</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  This will permanently delete the selected links and all their click analytics.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkDeleteConfirm}
                    disabled={isBulkDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70"
                  >
                    {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={isBulkDeleting}
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors"
                  >
                    Cancel
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

