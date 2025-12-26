import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrashIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { getTagStats, type TagWithCount } from '@/lib/services/categories'
import { fetchTagAliases, createTagAlias, deleteTagAlias, mergeTags, type TagAlias } from '@/lib/services/categoryMeta'
import { useToast } from '@/contexts/ToastContext'

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithCount[]>([])
  const [aliases, setAliases] = useState<TagAlias[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [sourceTag, setSourceTag] = useState<string>('')
  const [targetTag, setTargetTag] = useState<string>('')
  const [isMerging, setIsMerging] = useState(false)
  const [mergePreview, setMergePreview] = useState<number | null>(null)
  
  // Alias state
  const [showAliasModal, setShowAliasModal] = useState(false)
  const [newAlias, setNewAlias] = useState<string>('')
  const [newCanonical, setNewCanonical] = useState<string>('')
  const [isCreatingAlias, setIsCreatingAlias] = useState(false)
  
  const toast = useToast()

  useEffect(() => {
    document.title = 'Tags | AI Image Prompts Admin'
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [tagsData, aliasesData] = await Promise.all([
        getTagStats(),
        fetchTagAliases(),
      ])

      setTags(tagsData.tags)
      setAliases(aliasesData)
    } catch (err) {
      console.error(err)
      setError('Unable to load tags right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getCanonicalTag = (tag: string): string => {
    const alias = aliases.find(a => a.alias === tag.toLowerCase())
    return alias ? alias.canonical_tag : tag
  }

  const handleMergeClick = (tag: string) => {
    setSourceTag(tag)
    setTargetTag('')
    setMergePreview(null)
    setShowMergeModal(true)
  }

  const handleMergePreview = async () => {
    if (!sourceTag || !targetTag || sourceTag.toLowerCase() === targetTag.toLowerCase()) {
      return
    }

    try {
      // Count how many prompts would be affected
      const sourceCount = tags.find(t => t.tag === sourceTag.toLowerCase())?.count || 0
      setMergePreview(sourceCount)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (sourceTag && targetTag && sourceTag.toLowerCase() !== targetTag.toLowerCase()) {
      handleMergePreview()
    } else {
      setMergePreview(null)
    }
  }, [sourceTag, targetTag])

  const handleMergeConfirm = async () => {
    if (!sourceTag || !targetTag || sourceTag.toLowerCase() === targetTag.toLowerCase()) {
      toast.error('Please select different source and target tags.')
      return
    }

    setIsMerging(true)
    try {
      const affectedCount = await mergeTags(sourceTag, targetTag)
      toast.success(`Successfully merged "${sourceTag}" into "${targetTag}". ${affectedCount} prompt(s) updated.`)
      setShowMergeModal(false)
      setSourceTag('')
      setTargetTag('')
      setMergePreview(null)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(`Failed to merge tags: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsMerging(false)
    }
  }

  const handleCreateAlias = async () => {
    if (!newAlias.trim() || !newCanonical.trim()) {
      toast.error('Please enter both alias and canonical tag.')
      return
    }

    setIsCreatingAlias(true)
    try {
      await createTagAlias(newAlias.trim(), newCanonical.trim())
      toast.success('Tag alias created successfully!')
      setShowAliasModal(false)
      setNewAlias('')
      setNewCanonical('')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(`Failed to create alias: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsCreatingAlias(false)
    }
  }

  const handleDeleteAlias = async (alias: string) => {
    if (!confirm(`Are you sure you want to delete the alias "${alias}"?`)) {
      return
    }

    try {
      await deleteTagAlias(alias)
      toast.success('Alias deleted successfully!')
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete alias. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Tags</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage tags, merge duplicates, and configure aliases.</p>
        </div>
        <button
          onClick={() => setShowAliasModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE1A] hover:bg-[#ffe64d] text-black font-bold rounded-xl transition-colors text-sm shadow-[0_0_20px_-5px_#FFDE1A] active:scale-95"
        >
          <span>Add Alias</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Tags Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          {tags.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400">No tags found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Tag</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Usage Count</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Canonical Tag</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {tags.map((tag) => {
                  const canonical = getCanonicalTag(tag.tag)
                  const isAliased = canonical !== tag.tag.toLowerCase()
                  
                  return (
                    <motion.tr
                      key={tag.tag}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-white">#{tag.tag}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {tag.count}
                      </td>
                      <td className="px-6 py-4">
                        {isAliased ? (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">→ #{canonical}</span>
                        ) : (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleMergeClick(tag.tag)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                          Merge
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Aliases Section */}
      {aliases.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tag Aliases</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Mappings from aliases to canonical tags.</p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">#{alias.alias}</span>
                    <ArrowRightIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">#{alias.canonical_tag}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteAlias(alias.alias)}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      <AnimatePresence>
        {showMergeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowMergeModal(false)
                setSourceTag('')
                setTargetTag('')
                setMergePreview(null)
              }}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Merge Tags</h2>
                  <button
                    onClick={() => {
                      setShowMergeModal(false)
                      setSourceTag('')
                      setTargetTag('')
                      setMergePreview(null)
                    }}
                    className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Source Tag (will be replaced)</label>
                    <input
                      type="text"
                      value={sourceTag}
                      onChange={(e) => setSourceTag(e.target.value)}
                      placeholder="Enter source tag"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Target Tag (will replace source)</label>
                    <input
                      type="text"
                      value={targetTag}
                      onChange={(e) => setTargetTag(e.target.value)}
                      placeholder="Enter target tag"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                  </div>

                  {mergePreview !== null && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        This will update approximately <strong>{mergePreview}</strong> prompt(s).
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setShowMergeModal(false)
                      setSourceTag('')
                      setTargetTag('')
                      setMergePreview(null)
                    }}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    disabled={isMerging}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMergeConfirm}
                    disabled={isMerging || !sourceTag || !targetTag || sourceTag.toLowerCase() === targetTag.toLowerCase()}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isMerging ? 'Merging...' : 'Merge Tags'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Alias Modal */}
      <AnimatePresence>
        {showAliasModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAliasModal(false)
                setNewAlias('')
                setNewCanonical('')
              }}
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create Tag Alias</h2>
                  <button
                    onClick={() => {
                      setShowAliasModal(false)
                      setNewAlias('')
                      setNewCanonical('')
                    }}
                    className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Alias</label>
                    <input
                      type="text"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      placeholder="e.g., portraits"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Canonical Tag</label>
                    <input
                      type="text"
                      value={newCanonical}
                      onChange={(e) => setNewCanonical(e.target.value)}
                      placeholder="e.g., portrait"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      When users use the alias, it will be resolved to this canonical tag.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setShowAliasModal(false)
                      setNewAlias('')
                      setNewCanonical('')
                    }}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    disabled={isCreatingAlias}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAlias}
                    disabled={isCreatingAlias || !newAlias.trim() || !newCanonical.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreatingAlias ? 'Creating...' : 'Create Alias'}
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

