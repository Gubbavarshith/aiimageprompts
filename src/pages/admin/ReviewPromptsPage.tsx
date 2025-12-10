import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import {
  fetchPromptsForReview,
  approvePrompt,
  rejectPrompt,
  subscribeToPromptChanges,
  type PromptRecord,
  type PromptChangePayload,
} from '@/lib/services/prompts'
import { useToast } from '@/contexts/ToastContext'

const FALLBACK_IMAGE = 'https://placehold.co/96x96/0c0c0e/ffffff?text=AI'

const sortPromptsByNewest = (records: PromptRecord[]) =>
  [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

export default function ReviewPromptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord | null>(null)
  
  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkApproving, setIsBulkApproving] = useState(false)
  const [showBulkApproveConfirm, setShowBulkApproveConfirm] = useState(false)

  const toast = useToast()

  const loadPrompts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch all non-published prompts for moderation
      const moderationQueue = await fetchPromptsForReview()
      setPrompts(sortPromptsByNewest(moderationQueue))
    } catch (err) {
      console.error(err)
      setError('Unable to load prompts right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Review Prompts | AI Image Prompts Admin'
    loadPrompts()
  }, [loadPrompts])

  const handleRealtimeChange = useCallback(
    (payload: PromptChangePayload) => {
      setPrompts(prev => {
        if (payload.eventType === 'INSERT') {
          const inserted = payload.new as PromptRecord | null
          if (!inserted || inserted.status === 'Published') return prev
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
          // Remove if status changed to Published
          if (updatedPrompt.status === 'Published') {
            // Remove from selectedIds if approved/rejected
            setSelectedIds(prevSelected => {
              const newSelected = new Set(prevSelected)
              if (newSelected.has(updatedPrompt.id)) {
                newSelected.delete(updatedPrompt.id)
              }
              return newSelected
            })
            return prev.filter(prompt => prompt.id !== updatedPrompt.id)
          }
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

  // Filter prompts based on search
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.category.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [prompts, searchTerm])

  // Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.size === filteredPrompts.length) {
      setSelectedIds(new Set())
    } else {
      const newSelected = new Set(filteredPrompts.map(p => p.id))
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

  const handleBulkApproveClick = () => {
    if (selectedIds.size > 0) {
      setShowBulkApproveConfirm(true)
    }
  }

  const handleBulkApproveConfirm = async () => {
    setIsBulkApproving(true)
    try {
      const idsToApprove = Array.from(selectedIds)
      
      // Approve all selected prompts
      await Promise.all(idsToApprove.map(id => approvePrompt(id)))
      
      // Remove approved prompts from the list
      setPrompts(prev => prev.filter(p => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
      setShowBulkApproveConfirm(false)
      setIsSelectionMode(false)
      toast.success(`Successfully approved ${idsToApprove.length} ${idsToApprove.length === 1 ? 'prompt' : 'prompts'}!`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve some prompts. Please try again.')
    } finally {
      setIsBulkApproving(false)
    }
  }

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await approvePrompt(id)
      setPrompts(prev => prev.filter(prompt => prompt.id !== id))
      toast.success('Prompt approved and published!')
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve prompt. Please try again.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setRejectingId(id)
    try {
      await rejectPrompt(id)
      setPrompts(prev => prev.filter(prompt => prompt.id !== id))
      toast.success('Prompt rejected.')
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject prompt. Please try again.')
    } finally {
      setRejectingId(null)
    }
  }

  const pendingCount = prompts.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Review Prompts
            </h1>
            {/* Pending Count Pill - Always visible */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-lg ${
                pendingCount > 0 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <ClockIcon className="w-4 h-4" />
              <span>{pendingCount}</span>
            </motion.div>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Review and approve user-submitted prompts before they go live.
          </p>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {isSelectionMode && selectedIds.size > 0 && (
            <AnimatePresence>
              <motion.button
                initial={{ opacity: 0, width: 0, padding: 0 }}
                animate={{ opacity: 1, width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}
                exit={{ opacity: 0, width: 0, padding: 0 }}
                onClick={handleBulkApproveClick}
                disabled={isBulkApproving}
                className="overflow-hidden flex items-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white border border-green-700 rounded-full transition-colors text-sm font-bold shadow-lg shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
                <span className="shrink-0">Approve All ({selectedIds.size})</span>
              </motion.button>
            </AnimatePresence>
          )}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode)
              if (isSelectionMode) setSelectedIds(new Set())
            }}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-full transition-colors text-sm font-medium ${
              isSelectionMode
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white hover:opacity-90'
                : 'bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-300'
            }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
          </button>
        </div>
      </div>

      {/* Search and Select All */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search pending prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-[#FFDE1A]/50 transition-colors"
          />
        </div>
        {isSelectionMode && filteredPrompts.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredPrompts.length && filteredPrompts.length > 0}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
            />
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
              Select All ({filteredPrompts.length})
            </label>
          </div>
        )}
      </div>

      {/* Prompts List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="p-12 text-center animate-pulse text-zinc-500 dark:text-zinc-400">
            Loading pending prompts...
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 mb-4">
              <CheckCircleIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              {error ?? (searchTerm ? 'No prompts found matching your search.' : 'No pending prompts to review. All caught up! 🎉')}
            </p>
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
          <div className="divide-y divide-zinc-200 dark:divide-white/5">
            {filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 transition-colors ${
                  selectedIds.has(prompt.id)
                    ? 'bg-green-500/5 dark:bg-green-500/5'
                    : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                }`}
                onClick={() => {
                  if (isSelectionMode) toggleSelection(prompt.id)
                }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Checkbox for Selection */}
                  {isSelectionMode && (
                    <div className="flex items-start pt-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(prompt.id)}
                        onChange={() => toggleSelection(prompt.id)}
                        className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                      />
                    </div>
                  )}
                  
                  {/* Left: Preview Image */}
                  <div className="w-full lg:w-32 h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                    <img
                      src={prompt.preview_image_url ?? FALLBACK_IMAGE}
                      alt={prompt.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Center: Prompt Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">
                          {prompt.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/5">
                            {prompt.category}
                          </span>
                          {prompt.user_id && (
                            <span className="inline-flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              User Submission
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {new Date(prompt.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prompt Text Preview */}
                    <div className="mb-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 font-mono bg-zinc-50 dark:bg-black/50 p-3 rounded-lg border border-zinc-200 dark:border-white/5">
                        {prompt.prompt}
                      </p>
                    </div>

                    {/* Tags */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Negative Prompt */}
                    {prompt.negative_prompt && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Negative Prompt:
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-200 dark:border-red-500/20">
                          {prompt.negative_prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 lg:w-48 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedPrompt(prompt)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Full Details
                    </button>
                    {!isSelectionMode && (
                      <>
                        <button
                          onClick={() => handleApprove(prompt.id)}
                          disabled={approvingId === prompt.id || rejectingId === prompt.id}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm font-bold shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === prompt.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              Approve & Publish
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(prompt.id)}
                          disabled={approvingId === prompt.id || rejectingId === prompt.id}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rejectingId === prompt.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-5 h-5" />
                              Reject
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Approve Confirmation Modal */}
      <AnimatePresence>
        {showBulkApproveConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkApproveConfirm(false)}
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
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Approve {selectedIds.size} Prompts?
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                  Are you sure you want to approve and publish {selectedIds.size} selected {selectedIds.size === 1 ? 'prompt' : 'prompts'}? They will be visible on the public site immediately.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkApproveConfirm}
                    disabled={isBulkApproving}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBulkApproving ? 'Approving...' : 'Approve All'}
                  </button>
                  <button
                    onClick={() => setShowBulkApproveConfirm(false)}
                    disabled={isBulkApproving}
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

      {/* Full Details Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrompt(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-[#0c0c0e] border-b border-zinc-200 dark:border-white/10 p-6 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {selectedPrompt.title}
                  </h2>
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Image */}
                  {selectedPrompt.preview_image_url && (
                    <div className="w-full h-64 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10">
                      <img
                        src={selectedPrompt.preview_image_url}
                        alt={selectedPrompt.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Category
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {selectedPrompt.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Submitted
                      </p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {new Date(selectedPrompt.created_at).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Prompt Text
                    </p>
                    <div className="p-4 bg-zinc-50 dark:bg-black/50 rounded-lg border border-zinc-200 dark:border-white/5">
                      <p className="text-sm text-zinc-900 dark:text-white font-mono whitespace-pre-wrap">
                        {selectedPrompt.prompt}
                      </p>
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  {selectedPrompt.negative_prompt && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        Negative Prompt
                      </p>
                      <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                        <p className="text-sm text-zinc-900 dark:text-white font-mono whitespace-pre-wrap">
                          {selectedPrompt.negative_prompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPrompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 rounded-full text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
                    <button
                      onClick={() => {
                        handleApprove(selectedPrompt.id)
                        setSelectedPrompt(null)
                      }}
                      disabled={approvingId === selectedPrompt.id || rejectingId === selectedPrompt.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedPrompt.id)
                        setSelectedPrompt(null)
                      }}
                      disabled={approvingId === selectedPrompt.id || rejectingId === selectedPrompt.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

