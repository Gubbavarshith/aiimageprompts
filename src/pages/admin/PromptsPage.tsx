import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import {
  fetchPrompts as fetchPromptsFromApi,
  deletePrompt,
  deletePrompts,
  subscribeToPromptChanges,
  type PromptRecord,
  type PromptChangePayload,
} from '@/lib/services/prompts'
import { useToast } from '@/contexts/ToastContext'
import { useAdmin } from '@/contexts/AdminContext'

const DEFAULT_ITEMS_PER_PAGE = 5
const FALLBACK_IMAGE = 'https://placehold.co/96x96/0c0c0e/ffffff?text=AI'
const STATUS_OPTIONS = ['Published', 'Draft', 'Review', 'Pending', 'Rejected']

const sortPromptsByNewest = (records: PromptRecord[]) =>
  [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())


export default function PromptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null)

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const { openPromptForm } = useAdmin()
  const toast = useToast()

  const loadPrompts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPromptsFromApi()
      setPrompts(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load prompts right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Prompts | AI Image Prompts Admin'
    loadPrompts()
  }, [loadPrompts])

  const handleRealtimeChange = useCallback(
    (payload: PromptChangePayload) => {
      setPrompts(prev => {
        if (payload.eventType === 'INSERT') {
          const inserted = payload.new as PromptRecord | null
          if (!inserted) return prev
          const existingIndex = prev.findIndex(prompt => prompt.id === inserted.id)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = inserted
            return sortPromptsByNewest(updated)
          }
          return sortPromptsByNewest([inserted, ...prev])
        }

        if (payload.eventType === 'UPDATE') {
          const updatedPrompt = payload.new as PromptRecord | null
          if (!updatedPrompt) return prev
          return sortPromptsByNewest(
            prev.map(prompt => (prompt.id === updatedPrompt.id ? updatedPrompt : prompt)),
          )
        }

        if (payload.eventType === 'DELETE') {
          const removedPrompt = payload.old as PromptRecord | null
          if (!removedPrompt) return prev
          // Remove from selectedIds if deleted
          setSelectedIds(prevSelected => {
            const newSelected = new Set(prevSelected)
            if (newSelected.has(removedPrompt.id)) {
              newSelected.delete(removedPrompt.id)
            }
            return newSelected
          })
          return prev.filter(prompt => prompt.id !== removedPrompt.id)
        }

        return prev
      })
    },
    [],
  )

  useEffect(() => {
    const unsubscribe = subscribeToPromptChanges(handleRealtimeChange)
    return () => {
      unsubscribe()
    }
  }, [handleRealtimeChange])

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(prompts.map(p => p.category))).sort()
  }, [prompts])

  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(prompts.map(p => p.status)))
    return unique.length ? unique : STATUS_OPTIONS
  }, [prompts])

  // Filter prompts based on search, status, and category
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || prompt.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [prompts, searchTerm, statusFilter, categoryFilter])

  // Pagination
  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex)

  // Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedPrompts.length) {
      // Deselect all on this page (or clear all?) - choosing clear all for simplicity
      setSelectedIds(new Set())
    } else {
      // Select all on this page
      const newSelected = new Set(selectedIds)
      paginatedPrompts.forEach(p => newSelected.add(p.id))
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

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setShowBulkDeleteConfirm(true)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true)
    try {
      const idsToDelete = Array.from(selectedIds)
      await deletePrompts(idsToDelete)

      // Always refresh from server to avoid stale state if RLS blocks anything
      await loadPrompts()
      setSelectedIds(new Set())
      setShowBulkDeleteConfirm(false)
      setIsSelectionMode(false)
      toast.success(`Successfully deleted ${idsToDelete.length} prompts.`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete selected prompts.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleNewPrompt = () => {
    openPromptForm()
  }

  const handleEdit = (prompt: PromptRecord) => {
    openPromptForm(prompt)
  }

  const handleDeleteClick = (id: string, title: string) => {
    setShowDeleteConfirm({ id, title })
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm) return

    const { id } = showDeleteConfirm
    setShowDeleteConfirm(null)
    setDeletingId(id)

    try {
      await deletePrompt(id)
      // Refresh from server to confirm deletion persisted
      await loadPrompts()
      toast.success('Prompt deleted successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong while deleting this prompt. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setCategoryFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }





  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm !== ''

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Prompts</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your AI image prompts library.</p>
        </div>

        <button
          onClick={handleNewPrompt}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE1A] hover:bg-[#ffe64d] text-black font-bold rounded-xl transition-colors text-sm shadow-[0_0_20px_-5px_#FFDE1A] active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Filters & Search & Select */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Select Button (Left Side) */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              if (isSelectionMode) setSelectedIds(new Set()) // Clear selection when exiting
            }}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors text-sm font-medium min-w-[100px] justify-center ${isSelectionMode
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white hover:opacity-90'
              : 'bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-300'
              }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </button>

          {/* Bulk Delete Action */}
          <AnimatePresence>
            {isSelectionMode && selectedIds.size > 0 && (
              <motion.button
                initial={{ opacity: 0, width: 0, padding: 0 }}
                animate={{ opacity: 1, width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}
                exit={{ opacity: 0, width: 0, padding: 0 }}
                onClick={handleBulkDeleteClick}
                className="overflow-hidden flex items-center gap-2 py-3 bg-red-500 text-white border border-red-600 rounded-xl transition-colors text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 whitespace-nowrap"
              >
                <TrashIcon className="w-5 h-5 shrink-0" />
                <span className="shrink-0">Delete ({selectedIds.size})</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors text-sm font-medium ${showFilters || hasActiveFilters
              ? 'bg-[#FFDE1A]/10 border-[#FFDE1A]/50 text-[#FFDE1A] dark:text-[#FFDE1A]'
              : 'bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-300'
              }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#FFDE1A] text-black text-xs font-bold rounded-full">
                {[statusFilter !== 'all' ? 1 : 0, categoryFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
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
                    <button
                      onClick={clearFilters}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    >
                      <option value="all">All Status</option>
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center animate-pulse text-zinc-500 dark:text-zinc-400">
              Loading prompts...
            </div>
          ) : paginatedPrompts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400">
                {error ?? 'No prompts found matching your filters.'}
              </p>
              {hasActiveFilters && !error && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-[#FFDE1A] hover:underline"
                >
                  Clear filters
                </button>
              )}
              {error && (
                <button
                  onClick={loadPrompts}
                  className="text-sm text-[#FFDE1A] hover:underline"
                >
                  Retry loading
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
                  {isSelectionMode && (
                    <th className="px-6 py-4 w-12">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={paginatedPrompts.every(p => selectedIds.has(p.id)) && paginatedPrompts.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                        />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider w-12">No.</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Prompt Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Created On</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {paginatedPrompts.map((prompt, index) => (
                  <motion.tr
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group transition-colors ${selectedIds.has(prompt.id)
                      ? 'bg-[#FFDE1A]/5 dark:bg-[#FFDE1A]/5'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                      }`}
                    onClick={() => {
                      if (isSelectionMode) toggleSelection(prompt.id)
                    }}
                  >
                    {isSelectionMode && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(prompt.id)}
                            onChange={() => toggleSelection(prompt.id)}
                            className="w-4 h-4 rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                          />
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                          <img
                            src={prompt.preview_image_url ?? FALLBACK_IMAGE}
                            alt={prompt.title}
                            width="48"
                            height="48"
                            decoding="async"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-[#FFDE1A] transition-colors line-clamp-1">
                            {prompt.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            ⭐ {typeof prompt.rating_avg === 'number' ? prompt.rating_avg.toFixed(1) : '–'} ({prompt.rating_count ?? 0})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5">
                        {prompt.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        prompt.status === 'Published'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                          : prompt.status === 'Draft'
                            ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                            : prompt.status === 'Pending'
                              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                              : prompt.status === 'Rejected'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          prompt.status === 'Published'
                            ? 'bg-green-500 dark:bg-green-400'
                            : prompt.status === 'Draft'
                              ? 'bg-zinc-400'
                              : prompt.status === 'Pending'
                                ? 'bg-yellow-500 dark:bg-yellow-400'
                                : prompt.status === 'Rejected'
                                  ? 'bg-red-500 dark:bg-red-400'
                                  : 'bg-blue-500 dark:bg-blue-400'
                          }`} />
                        {prompt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(prompt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors active:scale-95"
                          title="Edit prompt"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(prompt.id, prompt.title)}
                          disabled={deletingId === prompt.id}
                          className={`p-2 rounded-lg transition-colors active:scale-95 ${deletingId === prompt.id
                            ? 'text-zinc-400 dark:text-zinc-600 bg-transparent cursor-not-allowed'
                            : 'text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10'
                            }`}
                          title="Delete prompt"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors lg:hidden active:scale-95"
                          title="More options"
                        >
                          <EllipsisHorizontalIcon className="w-4 h-4" />
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
        {filteredPrompts.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-[#0c0c0e]">
            <p className="text-xs text-zinc-500">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredPrompts.length)} of {filteredPrompts.length} prompts
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-2 py-1 text-xs bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${currentPage === 1
                  ? 'text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-white/5 cursor-not-allowed bg-zinc-100 dark:bg-transparent'
                  : 'text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95'
                  }`}
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${currentPage === totalPages
                  ? 'text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-white/5 cursor-not-allowed bg-zinc-100 dark:bg-transparent'
                  : 'text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 active:scale-95'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Prompt Form Modal */}



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
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete Prompt</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to delete "{showDeleteConfirm.title}"? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors active:scale-95"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
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
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Delete {selectedIds.size} Prompts?</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to delete the selected {selectedIds.size} prompts? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkDeleteConfirm}
                    disabled={isBulkDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={isBulkDeleting}
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div >
  )
}
