import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LinkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import {
  getTrackedLinks,
  deleteTrackedLink,
  toggleLinkStatus,
  type TrackedLinkWithStats,
} from '@/lib/services/trackedLinks'
import { useToast } from '@/contexts/ToastContext'
import LinkCreationModal from '@/components/admin/LinkCreationModal'

const SITE_URL = 'https://aiimageprompts.xyz'

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function LinkTrackingPage() {
  const [links, setLinks] = useState<TrackedLinkWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; campaign: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLink, setEditingLink] = useState<TrackedLinkWithStats | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const toast = useToast()

  const loadLinks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getTrackedLinks()
      setLinks(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load tracked links right now. Please try again.')
      toast.error('Failed to load tracked links')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    document.title = 'Link Tracking | AI Image Prompts Admin'
    loadLinks()
  }, [loadLinks])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteTrackedLink(id)
      setLinks(prev => prev.filter(link => link.id !== id))
      toast.success('Link deleted successfully')
      setShowDeleteConfirm(null)
    } catch (err: any) {
      console.error(err)
      toast.error(`Failed to delete link: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'paused') => {
    setTogglingId(id)
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active'
      await toggleLinkStatus(id, newStatus)
      setLinks(prev => prev.map(link => 
        link.id === id ? { ...link, status: newStatus } : link
      ))
      toast.success(`Link ${newStatus === 'active' ? 'activated' : 'paused'}`)
    } catch (err: any) {
      console.error(err)
      toast.error(`Failed to update link status: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleCopyLink = async (uniqueId: string) => {
    const shortUrl = `${SITE_URL}/go/${uniqueId}`
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopiedId(uniqueId)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.destination_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.unique_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const isEmptyState = !isLoading && links.length === 0
  const hasNoResults = !isLoading && links.length > 0 && filteredLinks.length === 0

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
              <LinkIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Link Tracking
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-11">
            Create and manage tracked links for campaign analytics
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            onClick={() => {
              setEditingLink(null)
              setShowCreateModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFDE1A] text-black font-semibold rounded-lg hover:bg-[#ffe64d] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Link
          </button>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by campaign, URL, platform, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {isEmptyState && (
        <div className="text-center py-12">
          <LinkIcon className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No tracked links yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">Create your first tracked link to start monitoring campaign performance</p>
          <button
            onClick={() => {
              setEditingLink(null)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-[#FFDE1A] text-black font-semibold rounded-lg hover:bg-[#ffe64d] transition-colors"
          >
            Create Link
          </button>
        </div>
      )}

      {/* No Results State */}
      {hasNoResults && (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">No links match your search criteria</p>
        </div>
      )}

      {/* Links Table */}
      {!isLoading && filteredLinks.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Short URL</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Destination</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Campaign</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">Clicks</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400 text-right">Unique</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Created</th>
                  <th className="p-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="p-4 w-32 text-right font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-[#FFDE1A]">
                          /go/{link.unique_id}
                        </code>
                        <button
                          onClick={() => handleCopyLink(link.unique_id)}
                          className="p-1 text-zinc-400 hover:text-[#FFDE1A] transition-colors"
                          title="Copy link"
                        >
                          {copiedId === link.unique_id ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs truncate text-zinc-600 dark:text-zinc-400" title={link.destination_url}>
                        {link.destination_url}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-900 dark:text-white">
                      {link.campaign_name}
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-900 dark:text-white">
                      {link.total_clicks.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      {link.unique_clicks.toLocaleString()}
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {formatDate(link.created_at)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(link.id, link.status)}
                        disabled={togglingId === link.id}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          link.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        } ${togglingId === link.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                      >
                        {togglingId === link.id ? '...' : link.status === 'active' ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/links/${link.id}`)}
                          className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-[#FFDE1A] hover:bg-[#FFDE1A]/10 rounded-lg transition-colors"
                          title="View Analytics"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLink(link)
                            setShowCreateModal(true)
                          }}
                          className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm({ id: link.id, campaign: link.campaign_name })}
                          disabled={deletingId === link.id}
                          className={`p-2 rounded-lg transition-colors ${
                            deletingId === link.id
                              ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                              : 'text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Link?</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                Are you sure you want to delete the link for campaign "{showDeleteConfirm.campaign}"? This will also delete all associated analytics data.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  disabled={deletingId === showDeleteConfirm.id}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-95 transition-colors disabled:opacity-50"
                >
                  {deletingId === showDeleteConfirm.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <LinkCreationModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingLink(null)
          }}
          onSuccess={() => {
            loadLinks()
            setShowCreateModal(false)
            setEditingLink(null)
          }}
          editingLink={editingLink}
        />
      )}
    </div>
  )
}

